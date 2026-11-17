import { rng } from "./rng";
import type { ProblemSeed } from "./types";

const arr = (r: ReturnType<typeof rng>, n: number, lo: number, hi: number) => Array.from({ length: n }, () => r.int(lo, hi));

export const prefixQueries: ProblemSeed = {
  slug: "range-sum-queries",
  title: "Range Sum Queries",
  difficulty: "easy",
  rating: 1000,
  tags: ["prefix-sum", "arrays"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 15,
  statement: "You are given an array of n integers and q queries. Each query gives two indices l and r. Print the sum of the elements from position l to position r, inclusive. Positions are numbered from 1.",
  inputFormat: "The first line contains n and q. The second line contains n integers. Each of the next q lines contains l and r.",
  outputFormat: "For each query print the sum on its own line.",
  constraints: "1 <= n, q <= 2 * 10^5\n1 <= a_i <= 10^9\n1 <= l <= r <= n",
  samples: [{ input: "5 3\n1 2 3 4 5\n1 5\n2 4\n3 3\n", output: "15\n9\n3\n", explanation: "2 + 3 + 4 = 9." }],
  hints: [
    "Adding up l..r for every query is O(n) per query. With 2 * 10^5 queries that is about 4 * 10^10 operations. Can you reuse work between queries?",
    "Precompute prefix sums: p[i] = a_1 + ... + a_i. The sum of l..r is a difference of two prefix sums.",
    "Build `long long p[n + 1]` with p[0] = 0. Answer each query with p[r] - p[l - 1]. Sums reach 2 * 10^14, so use long long.",
  ],
  editorial: "Define p[i] as the sum of the first i elements. Then sum(l..r) = p[r] - p[l-1]. Building p takes O(n) and each query O(1). The naive method is O(n * q) and times out. Sums can reach 2 * 10^5 * 10^9 = 2 * 10^14, so `long long` is required.\n\nComplexity: O(n + q).",
  reference: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    vector<long long> p(n + 1, 0);
    for (int i = 1; i <= n; i++) {
        long long x;
        cin >> x;
        p[i] = p[i - 1] + x;
    }
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << p[r] - p[l - 1] << "\\n";
    }
    return 0;
}`,
  hidden: () => {
    const r = rng(21);
    const mk = (n: number, q: number, lo: number, hi: number) => {
      const a = arr(r, n, lo, hi);
      const qs = Array.from({ length: q }, () => {
        const x = r.int(1, n);
        const y = r.int(1, n);
        return `${Math.min(x, y)} ${Math.max(x, y)}`;
      });
      return `${n} ${q}\n${a.join(" ")}\n${qs.join("\n")}\n`;
    };
    const full = (n: number) => `${n} ${n}\n${Array(n).fill(1e9).join(" ")}\n${Array.from({ length: n }, () => `1 ${n}`).join("\n")}\n`;
    return ["1 1\n7\n1 1\n", mk(5, 10, 1, 10), mk(100, 100, 1, 1e9), mk(1000, 1000, 1, 1e9), mk(200000, 200000, 1, 1e9), full(200000), mk(200000, 200000, 1, 3)];
  },
};

export const pairWithSum: ProblemSeed = {
  slug: "pair-with-given-sum",
  title: "Pair with Given Sum",
  difficulty: "easy",
  rating: 1200,
  tags: ["two-pointers", "sorting", "hashing"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 15,
  statement: "You are given n integers and a target x. Decide whether there are two different positions i and j (i != j) such that a_i + a_j = x. The same element value may be used twice only if it appears at two different positions.",
  inputFormat: "The first line contains n and x. The second line contains n integers.",
  outputFormat: "Print `YES` if such a pair exists, otherwise `NO`.",
  constraints: "2 <= n <= 2 * 10^5\n-10^9 <= a_i <= 10^9\n-2 * 10^9 <= x <= 2 * 10^9",
  samples: [
    { input: "4 9\n2 7 11 15\n", output: "YES\n", explanation: "2 + 7 = 9." },
    { input: "3 4\n2 5 9\n", output: "NO\n", explanation: "There is only one 2, so 2 + 2 is not allowed." },
  ],
  hints: [
    "Checking every pair is O(n^2), too slow for n = 2 * 10^5. For a fixed a_i, which value do you need to find?",
    "Sort the array and walk two pointers from both ends, or store seen values in a hash set.",
    "Sort a. Keep l = 0 and r = n - 1. If a[l] + a[r] is smaller than x move l right, if it is larger move r left, if equal print YES. Use long long for the sum.",
  ],
  editorial: "After sorting, two pointers find a pair in O(n): if the sum is too small, the only way to grow it is to advance the left pointer; if it is too large, move the right pointer. Because l < r always holds, the two positions are different. Use `long long` since a_i + a_j can reach 2 * 10^9.\n\nComplexity: O(n log n) for sorting, O(n) for the scan.",
  reference: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long x;
    cin >> n >> x;
    vector<long long> a(n);
    for (auto &v : a) cin >> v;
    sort(a.begin(), a.end());
    int l = 0, r = n - 1;
    while (l < r) {
        long long s = a[l] + a[r];
        if (s == x) { cout << "YES\\n"; return 0; }
        if (s < x) l++; else r--;
    }
    cout << "NO\\n";
    return 0;
}`,
  hidden: () => {
    const r = rng(22);
    const mk = (a: number[], x: number) => `${a.length} ${x}\n${a.join(" ")}\n`;
    const big = arr(r, 200000, -1e9, 1e9);
    const sorted = [...big].sort((p, q) => p - q);
    const out = [mk([5, 5], 10), mk([5, 6], 10), mk([3, 1], 4), mk([-1e9, -1e9], -2e9), mk([1e9, 1e9, 5], 2e9), mk([1, 2, 3, 4], 100), mk([2, 5, 9], 4)];
    out.push(mk(big, big[0]! + big[199999]!));
    out.push(mk(big, 2e9));
    out.push(mk(Array.from({ length: 200000 }, (_, i) => 2 * i), 399999));
    out.push(mk(r.shuffle(Array.from({ length: 200000 }, (_, i) => i * 2)), 3));
    out.push(mk(arr(r, 1000, -50, 50), r.int(-100, 100)));
    out.push(mk(sorted.slice(0, 50000).concat(sorted.slice(150000)), sorted[10]! + sorted[199990]!));
    return out;
  },
};

export const longestRun: ProblemSeed = {
  slug: "longest-equal-run",
  title: "Longest Equal Run",
  difficulty: "easy",
  rating: 1000,
  tags: ["implementation", "arrays"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 10,
  statement: "A run is a block of consecutive elements that are all equal. Given an array, print the length of its longest run.",
  inputFormat: "The first line contains n. The second line contains n integers.",
  outputFormat: "Print the length of the longest run.",
  constraints: "1 <= n <= 2 * 10^5\n1 <= a_i <= 10^9",
  samples: [{ input: "7\n1 1 2 2 2 3 3\n", output: "3\n" }, { input: "4\n5 6 5 6\n", output: "1\n" }],
  hints: [
    "Walk through the array once. What do you need to remember about the current run?",
    "Keep the length of the current run. Extend it when a_i equals the previous element, otherwise restart at 1.",
    "Start with best = cur = 1. For i from 1 to n - 1: `cur = (a[i] == a[i-1]) ? cur + 1 : 1; best = max(best, cur);`.",
  ],
  editorial: "One pass with a running counter. When the current element equals the previous one the run grows, otherwise it restarts at 1. Track the maximum seen. Start with both counters at 1 because every element is a run of length at least 1.\n\nComplexity: O(n).",
  reference: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    int best = 1, cur = 1;
    for (int i = 1; i < n; i++) {
        cur = (a[i] == a[i - 1]) ? cur + 1 : 1;
        best = max(best, cur);
    }
    cout << best << "\\n";
    return 0;
}`,
  hidden: () => {
    const r = rng(23);
    const mk = (a: number[]) => `${a.length}\n${a.join(" ")}\n`;
    return [mk([7]), mk([1, 1]), mk([1, 2]), mk([3, 3, 3, 3]), mk([1, 2, 2, 1, 1, 1, 2]), mk(arr(r, 1000, 1, 2)), mk(arr(r, 200000, 1, 1e9)), mk(Array(200000).fill(5)), mk(arr(r, 200000, 1, 2)), mk([...Array(100000).fill(1), ...Array(100000).fill(2)])];
  },
};

export const lowerBound: ProblemSeed = {
  slug: "first-not-smaller",
  title: "First Not Smaller",
  difficulty: "medium",
  rating: 1300,
  tags: ["binary-search", "arrays"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 20,
  statement: "You are given a sorted (non-decreasing) array of n integers and q queries. For each query x, print the smallest position i (numbered from 1) such that a_i >= x. If no element is at least x, print n + 1.",
  inputFormat: "The first line contains n and q. The second line contains n integers in non-decreasing order. Each of the next q lines contains one integer x.",
  outputFormat: "For each query print the answer on its own line.",
  constraints: "1 <= n, q <= 2 * 10^5\n-10^9 <= a_i, x <= 10^9",
  samples: [{ input: "5 4\n1 3 3 7 9\n3\n4\n10\n0\n", output: "2\n4\n6\n1\n" }],
  hints: [
    "A linear scan per query is O(n * q). The array is sorted, which is a big clue.",
    "Binary search: repeatedly halve the range where the answer can be. This pattern is usually called lower_bound.",
    "Use `lower_bound(a.begin(), a.end(), x) - a.begin() + 1`. It returns n + 1 automatically when every element is smaller than x.",
  ],
  editorial: "Because the array is sorted, the predicate 'a_i >= x' is false for a prefix and true afterwards. Binary search finds the first true position in O(log n). The standard library function `std::lower_bound` does exactly this and returns the end iterator, i.e. position n + 1, when nothing qualifies.\n\nComplexity: O((n + q) log n) overall.",
  reference: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    while (q--) {
        int x;
        cin >> x;
        cout << (lower_bound(a.begin(), a.end(), x) - a.begin()) + 1 << "\\n";
    }
    return 0;
}`,
  hidden: () => {
    const r = rng(24);
    const mk = (n: number, q: number, lo: number, hi: number) => {
      const a = arr(r, n, lo, hi).sort((p, s) => p - s);
      const qs = arr(r, q, lo - 2, hi + 2);
      return `${n} ${q}\n${a.join(" ")}\n${qs.join("\n")}\n`;
    };
    return [`1 3\n5\n5\n6\n4\n`, mk(5, 10, -3, 3), mk(100, 100, -20, 20), mk(1000, 1000, -1e9, 1e9), mk(200000, 200000, -1e9, 1e9), mk(200000, 200000, 0, 10), `200000 200000\n${Array(200000).fill(1000000000).join(" ")}\n${Array(200000).fill(1000000000).join("\n")}\n`];
  },
};

export const maxSubarray: ProblemSeed = {
  slug: "best-contiguous-sum",
  title: "Best Contiguous Sum",
  difficulty: "medium",
  rating: 1400,
  tags: ["dp", "greedy", "arrays"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 20,
  statement: "Given an array of n integers (some may be negative), find the largest possible sum of a non-empty contiguous subarray.",
  inputFormat: "The first line contains n. The second line contains n integers.",
  outputFormat: "Print the maximum subarray sum.",
  constraints: "1 <= n <= 2 * 10^5\n-10^9 <= a_i <= 10^9",
  samples: [{ input: "5\n-2 3 -1 4 -5\n", output: "6\n", explanation: "The subarray 3, -1, 4 has sum 6." }, { input: "3\n-5 -2 -9\n", output: "-2\n", explanation: "The subarray must be non-empty, so the best choice is the single element -2." }],
  hints: [
    "Trying all subarrays is O(n^2) (or O(n^3)). Think about the best subarray that ends exactly at position i.",
    "Let best_end[i] be the largest sum of a subarray ending at i. Either it extends the previous best, or starts fresh at a_i.",
    "Kadane's algorithm: `cur = max(a[i], cur + a[i]); ans = max(ans, cur);`. Initialise ans and cur with a[0], not 0, so all-negative arrays work. Use long long.",
  ],
  editorial: "Kadane's algorithm. Let cur be the best sum of a subarray ending at the current position: cur = max(a_i, cur + a_i). The answer is the maximum cur over all positions. Initialising with the first element handles arrays where every number is negative (the answer must be non-empty). Sums reach 2 * 10^14, so use `long long`.\n\nComplexity: O(n).",
  reference: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    long long cur = 0, ans = 0;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        cur = (i == 0) ? x : max(x, cur + x);
        ans = (i == 0) ? cur : max(ans, cur);
    }
    cout << ans << "\\n";
    return 0;
}`,
  hidden: () => {
    const r = rng(25);
    const mk = (a: number[]) => `${a.length}\n${a.join(" ")}\n`;
    return [mk([-1]), mk([5]), mk([-3, -1, -2]), mk([1, 2, 3]), mk([4, -10, 4]), mk(arr(r, 50, -10, 10)), mk(arr(r, 1000, -1e9, 1e9)), mk(arr(r, 200000, -1e9, 1e9)), mk(Array(200000).fill(1e9)), mk(Array(200000).fill(-1e9)), mk(arr(r, 200000, -1e9, 3e8))];
  },
};
