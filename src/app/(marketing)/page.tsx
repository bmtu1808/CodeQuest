import { Brain, Flame, Repeat, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DynamicIcon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getCurrentUser } from "@/server/auth/session";
import { loadCurriculum } from "@/server/services/path";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Zap, title: "Bite-sized lessons", text: "Each lesson takes 5 to 10 minutes: a short explanation, then questions you answer yourself." },
  { icon: Brain, title: "Learn by doing", text: "Predict output, find bugs, fix code and arrange lines. Every answer gets instant feedback with a reason." },
  { icon: Flame, title: "Stay motivated", text: "Earn XP, level up and build a daily streak. Replays never farm XP, so progress is honest." },
  { icon: Repeat, title: "Mistakes come back", text: "Questions you miss return at the end of the lesson until you get them right." },
];

export default async function LandingPage() {
  const [user, curriculum] = await Promise.all([getCurrentUser(), loadCurriculum()]);
  const primary = user ? { href: "/dashboard", label: "Go to dashboard" } : { href: "/signup", label: "Start Learning" };

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Site">
          <ThemeToggle />
          {!user && (
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-sky hover:bg-surface-2">
              Log in
            </Link>
          )}
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 lg:grid-cols-2 lg:pt-16">
        <div className="text-center lg:text-left">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-dark dark:text-brand">
            <Sparkles size={14} /> Learn C++. Think Algorithmically. Become a Problem Solver.
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">Master C++. One Challenge at a Time.</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted lg:mx-0">Learn programming, master algorithms, and become a competitive programmer through bite-sized interactive lessons.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <ButtonLink href={primary.href} size="lg">
              {primary.label}
            </ButtonLink>
            <ButtonLink href="#curriculum" variant="secondary" size="lg">
              Explore Curriculum
            </ButtonLink>
          </div>
        </div>

        <div aria-hidden className="relative mx-auto w-full max-w-md">
          <Card className="animate-float border-b-8 p-6 shadow-xl">
            <p className="text-xs font-extrabold uppercase tracking-widest text-sky">Predict the output</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-code p-4 font-mono text-sm leading-relaxed">{`int x = 5;\ncout << x + 3;`}</pre>
            <div className="mt-4 grid grid-cols-2 gap-3 font-mono font-bold">
              {["5", "8", "3", "Error"].map((o) => (
                <span key={o} className={`rounded-2xl border-2 border-b-4 px-4 py-3 text-center ${o === "8" ? "border-brand bg-brand/15 text-brand-dark dark:text-brand" : "border-line"}`}>
                  {o}
                </span>
              ))}
            </div>
            <p className="mt-4 text-center text-sm font-extrabold text-brand-dark dark:text-brand">+10 XP</p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="how">
        <h2 id="how" className="text-center text-3xl font-black">
          How CodeQuest teaches
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <Icon className="text-brand" size={28} />
              <h3 className="mt-3 text-lg font-black">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="curriculum" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-12" aria-labelledby="curr">
        <h2 id="curr" className="text-center text-3xl font-black">
          Your learning path
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted">Six worlds take you from Hello World to advanced competitive programming. The first world is open today; the rest are being written.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {curriculum.map(({ world, units }, i) => {
            const open = world.published && units.length > 0;
            const lessons = units.reduce((s, u) => s + u.lessons.length, 0);
            return (
              <Card key={world.id} className={open ? "" : "opacity-75"}>
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: world.color }}>
                    <DynamicIcon name={world.icon} size={22} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-muted">World {i + 1}</p>
                    <h3 className="font-black leading-tight">{world.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">{world.description}</p>
                {open ? (
                  <>
                    <p className="mt-3 text-xs font-bold text-brand-dark dark:text-brand">
                      Available · {units.length} units · {lessons} lessons
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {units.map((u) => (
                        <li key={u.unit.id}>• {u.unit.title}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-3 text-xs font-bold uppercase text-muted">Coming soon</p>
                )}
              </Card>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href={primary.href} size="lg">
            {primary.label}
          </ButtonLink>
        </div>
      </section>

      <footer className="border-t-2 border-line px-4 py-8 text-center text-sm text-muted">
        <Logo className="text-xl" />
        <p className="mt-2">Learn C++. Think Algorithmically. Become a Problem Solver.</p>
      </footer>
    </div>
  );
}
