import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { aggregate, judgeOne, outputsMatch } from "@/server/judge/checker";
import { Judge0Judge, mapStatus } from "@/server/judge/judge0";
import { JudgeUnavailableError } from "@/server/judge/types";
import { startFakeJudge0, type FakeJudge0 } from "./helpers/fake-judge0";

describe("output checker", () => {
  it("ignores whitespace differences but not token differences", () => {
    expect(outputsMatch("1 2 3\n", "1   2\n3")).toBe(true);
    expect(outputsMatch("hello\n", "hello")).toBe(true);
    expect(outputsMatch("1 2 3", "1 2")).toBe(false);
    expect(outputsMatch("1 2 3", "1 2 4")).toBe(false);
    expect(outputsMatch("abc", "ABC")).toBe(false);
    expect(outputsMatch("", "")).toBe(true);
    expect(outputsMatch("5", "")).toBe(false);
  });
  it("maps run status to a verdict", () => {
    expect(judgeOne("1", { status: "ok", stdout: "1\n" })).toBe("accepted");
    expect(judgeOne("1", { status: "ok", stdout: "2" })).toBe("wrong_answer");
    expect(judgeOne("1", { status: "time_limit", stdout: "1" })).toBe("time_limit_exceeded");
    expect(judgeOne("1", { status: "runtime_error", stdout: "1" })).toBe("runtime_error");
  });
  it("aggregates: first failing test decides, passed count is exact", () => {
    const ok = { status: "ok", stdout: "1", timeMs: 10, memoryKb: 100 };
    const a = aggregate(["1", "1", "1"], [ok, { ...ok, stdout: "2", timeMs: 30 }, { status: "time_limit", stdout: "", timeMs: 1000, memoryKb: 5 }]);
    expect(a).toMatchObject({ verdict: "wrong_answer", failedTest: 2, passed: 1, total: 3, timeMs: 1000, memoryKb: 100 });
    expect(aggregate(["1"], [ok])).toMatchObject({ verdict: "accepted", failedTest: null, passed: 1 });
    const ce = aggregate(["1", "1"], [{ status: "compilation_error", stdout: "", timeMs: null, memoryKb: null }, ok]);
    expect(ce).toMatchObject({ verdict: "compilation_error", failedTest: null, passed: 0 });
  });
  it("an empty test list is never 'accepted' by accident", () => {
    expect(aggregate([], []).total).toBe(0);
  });
});

describe("judge0 status mapping", () => {
  const lim = { timeMs: 1000, memoryMb: 256 };
  it("maps Judge0 status ids", () => {
    expect(mapStatus(3, 100, lim)).toBe("ok");
    expect(mapStatus(5, 100, lim)).toBe("time_limit");
    expect(mapStatus(6, null, lim)).toBe("compilation_error");
    for (const id of [7, 8, 9, 10, 11, 12]) expect(mapStatus(id, 100, lim)).toBe("runtime_error");
    expect(mapStatus(13, 100, lim)).toBe("internal_error");
  });
  it("detects memory limit by usage even when Judge0 reports a runtime error", () => {
    expect(mapStatus(7, 300 * 1024, lim)).toBe("memory_limit");
  });
});

describe("Judge0 client against a Judge0-compatible server (real g++)", () => {
  let fake: FakeJudge0;
  let judge: Judge0Judge;
  beforeAll(async () => {
    fake = await startFakeJudge0();
    judge = new Judge0Judge({ baseUrl: fake.url, languageIds: { cpp17: 54, cpp20: 105 }, pollTimeoutMs: 20_000 });
  });
  afterAll(async () => fake.close());
  const limits = { timeMs: 1000, memoryMb: 256 };
  const sum = `#include <iostream>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}`;

  it("runs a correct program on several inputs, in order", async () => {
    const r = await judge.run(sum, "cpp17", ["1 2\n", "10 20\n", "-5 5\n"], limits);
    expect(r.map((x) => x.status)).toEqual(["ok", "ok", "ok"]);
    expect(r.map((x) => x.stdout.trim())).toEqual(["3", "30", "0"]);
  });
  it("reports compilation errors with the compiler output", async () => {
    const r = await judge.run("int main( { return 0 }", "cpp17", ["1"], limits);
    expect(r[0]!.status).toBe("compilation_error");
    expect(r[0]!.compileOutput.length).toBeGreaterThan(0);
  });
  it("reports time limit exceeded", async () => {
    const r = await judge.run("int main(){ for(;;){} }", "cpp17", [""], { timeMs: 300, memoryMb: 256 });
    expect(r[0]!.status).toBe("time_limit");
  });
  it("reports runtime errors", async () => {
    const r = await judge.run("#include <cstdlib>\nint main(){ std::abort(); }", "cpp17", [""], limits);
    expect(r[0]!.status).toBe("runtime_error");
    const nz = await judge.run("int main(){ return 3; }", "cpp17", [""], limits);
    expect(nz[0]!.status).toBe("runtime_error");
  });
  it("supports C++20", async () => {
    const src = `#include <iostream>\n#include <bit>\nint main(){ std::cout << std::popcount(255u); }`;
    const r = await judge.run(src, "cpp20", [""], limits);
    expect(r[0]!.stdout.trim()).toBe("8");
  });
  it("splits more than 20 tests into several batches and keeps order", async () => {
    const before = fake.stats.batches;
    const inputs = Array.from({ length: 25 }, (_, i) => `${i} 1\n`);
    const r = await judge.run(sum, "cpp17", inputs, limits);
    expect(r.map((x) => x.stdout.trim())).toEqual(inputs.map((_, i) => String(i + 1)));
    expect(fake.stats.batches - before).toBe(2);
  }, 60_000);
  it("throws JudgeUnavailableError when the judge is down or errors", async () => {
    fake.failWith = 503;
    await expect(judge.run(sum, "cpp17", ["1 2"], limits)).rejects.toBeInstanceOf(JudgeUnavailableError);
    fake.failWith = 401;
    await expect(judge.run(sum, "cpp17", ["1 2"], limits)).rejects.toBeInstanceOf(JudgeUnavailableError);
    fake.failWith = undefined;
    const dead = new Judge0Judge({ baseUrl: "http://127.0.0.1:1", languageIds: { cpp17: 54, cpp20: 105 } });
    await expect(dead.run(sum, "cpp17", ["1 2"], limits)).rejects.toBeInstanceOf(JudgeUnavailableError);
  });
});
