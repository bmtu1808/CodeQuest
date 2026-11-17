import { rng } from "./rng";
import type { ProblemSeed } from "./types";

const MAX = 1_000_000_000_000_000_000n;

export const aPlusB: ProblemSeed = {
  slug: "sum-of-two-numbers",
  title: "Sum of Two Numbers",
  difficulty: "newbie",
  rating: 800,
  tags: ["math", "implementation"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 5,
  statement:
    "You are given two integers a and b. Print their sum.\n\nThe numbers can be very large, so think about which integer type is big enough to hold the result.",
  inputFormat: "One line with two integers a and b.",
  outputFormat: "Print a + b.",
  constraints: "-10^18 <= a, b <= 10^18",
  samples: [
    { input: "3 4\n", output: "7\n" },
    { input: "-1000000000000000000 -1000000000000000000\n", output: "-2000000000000000000\n", explanation: "The result does not fit in a 32-bit int, but it fits in long long." },
  ],
  hints: [
    "The sum is just a + b. The only trap is the size of the numbers.",
    "An int holds about 2 * 10^9. The values here reach 10^18, so use a 64-bit type.",
    "Declare `long long a, b;`, read them with cin and print a + b.",
  ],
  editorial:
    "The largest possible sum is 2 * 10^18, which is below 9.2 * 10^18, the limit of a signed 64-bit integer. So `long long` is enough. Using `int` overflows (undefined behaviour) and produces wrong answers on large tests.\n\nComplexity: O(1).",
  reference: `#include <iostream>
using namespace std;
int main() {
    long long a, b;
    cin >> a >> b;
    cout << a + b << "\\n";
    return 0;
}`,
  hidden: () => {
    const r = rng(11);
    const t = ["0 0", `${MAX} ${MAX}`, `-${MAX} -${MAX}`, `${MAX} -${MAX}`, "1 -1", "2147483647 1", "-2147483648 -1", "123456789012 987654321098"];
    for (let i = 0; i < 8; i++) t.push(`${r.big(-MAX, MAX)} ${r.big(-MAX, MAX)}`);
    return t.map((x) => `${x}\n`);
  },
};

export const countEvens: ProblemSeed = {
  slug: "count-even-numbers",
  title: "Count Even Numbers",
  difficulty: "newbie",
  rating: 800,
  tags: ["implementation", "loops", "math"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 5,
  statement: "You are given a list of n integers. Count how many of them are even. Zero is even, and negative numbers can be even too.",
  inputFormat: "The first line contains n. The second line contains n integers a_1, ..., a_n.",
  outputFormat: "Print the number of even integers in the list.",
  constraints: "1 <= n <= 1000\n-10^9 <= a_i <= 10^9",
  samples: [
    { input: "5\n1 2 3 4 6\n", output: "3\n", explanation: "The even numbers are 2, 4 and 6." },
    { input: "4\n-2 -3 0 7\n", output: "2\n", explanation: "-2 and 0 are even." },
  ],
  hints: [
    "Look at each number on its own and keep a counter.",
    "A number is even when the remainder of dividing it by 2 is 0.",
    "Loop n times, read x, and do `if (x % 2 == 0) count++;`. This also works for negative x, because -3 % 2 is -1, not 0.",
  ],
  editorial: "Read the numbers one by one and increment a counter when `x % 2 == 0`. In C++ the remainder of a negative odd number is -1 (never 0), so the test is safe for negatives.\n\nComplexity: O(n).",
  reference: `#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    int cnt = 0;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        if (x % 2 == 0) cnt++;
    }
    cout << cnt << "\\n";
    return 0;
}`,
  hidden: () => {
    const r = rng(12);
    const mk = (n: number, lo: number, hi: number) => `${n}\n${Array.from({ length: n }, () => r.int(lo, hi)).join(" ")}\n`;
    return ["1\n0\n", "1\n7\n", "1\n-8\n", "3\n1000000000 -1000000000 999999999\n", mk(10, -5, 5), mk(100, -1e9, 1e9), mk(1000, -1e9, 1e9), mk(1000, 0, 1), `1000\n${Array(1000).fill(2).join(" ")}\n`, `1000\n${Array(1000).fill(-3).join(" ")}\n`];
  },
};

const NAMES = ["Ada", "Linus", "Grace", "Alan", "Margaret", "Dennis", "Bjarne", "Edsger", "Barbara", "Ken"];

export const helloName: ProblemSeed = {
  slug: "hello-coder",
  title: "Hello, Coder!",
  difficulty: "newbie",
  rating: 800,
  tags: ["strings", "implementation"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 5,
  statement: "Read a name and greet the person exactly as shown in the examples.",
  inputFormat: "One line containing a single word: the name.",
  outputFormat: "Print `Hello, <name>!` where <name> is the word from the input.",
  constraints: "The name has between 1 and 20 English letters.",
  samples: [
    { input: "Ada\n", output: "Hello, Ada!\n" },
    { input: "Bjarne\n", output: "Hello, Bjarne!\n" },
  ],
  hints: [
    "Read the name into a string, then print it between fixed pieces of text.",
    "`cin >> s` reads one word into a string s.",
    "Print `\"Hello, \" << s << \"!\"`. Mind the comma, the space and the exclamation mark.",
  ],
  editorial: "Read a `string` with `cin >> name`, then print `Hello, ` followed by the name and `!`. The output must match the text exactly, including capital H, the comma and the space.\n\nComplexity: O(length of name).",
  reference: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    cin >> s;
    cout << "Hello, " << s << "!\\n";
    return 0;
}`,
  hidden: () => {
    const r = rng(13);
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const out = [...NAMES, "A", "Z", "abcdefghijklmnopqrst"];
    for (let i = 0; i < 6; i++) out.push(Array.from({ length: r.int(1, 20) }, () => r.pick([...letters])).join(""));
    return out.map((x) => `${x}\n`);
  },
};

export const digitSum: ProblemSeed = {
  slug: "sum-of-digits",
  title: "Sum of Digits",
  difficulty: "newbie",
  rating: 800,
  tags: ["math", "implementation"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 8,
  statement: "Given a non-negative integer n, print the sum of its decimal digits.",
  inputFormat: "One integer n.",
  outputFormat: "Print the sum of the digits of n.",
  constraints: "0 <= n <= 10^18",
  samples: [
    { input: "12345\n", output: "15\n", explanation: "1 + 2 + 3 + 4 + 5 = 15." },
    { input: "1000000000000000000\n", output: "1\n" },
  ],
  hints: [
    "You only need the digits one at a time, not the whole number.",
    "n % 10 is the last digit and n / 10 removes it.",
    "Use a `long long`. Loop while n > 0: add n % 10 to the answer, then do n /= 10. Remember that n can be 0.",
  ],
  editorial: "Repeatedly take the last digit with `% 10` and drop it with `/ 10` until the number becomes 0. Use `long long` because n can be 10^18. For n = 0 the loop does not run and the answer 0 is correct.\n\nComplexity: O(number of digits), at most 19 steps.",
  reference: `#include <iostream>
using namespace std;
int main() {
    long long n;
    cin >> n;
    int s = 0;
    while (n > 0) {
        s += n % 10;
        n /= 10;
    }
    cout << s << "\\n";
    return 0;
}`,
  hidden: () => {
    const r = rng(14);
    const t = ["0", "1", "9", "10", "99", "1000000000000000000", "999999999999999999", "2147483648", "4294967296", "123456789012345678"];
    for (let i = 0; i < 8; i++) t.push(String(r.big(0n, MAX)));
    return t.map((x) => `${x}\n`);
  },
};

export const primeCheck: ProblemSeed = {
  slug: "prime-or-not",
  title: "Prime or Not?",
  difficulty: "easy",
  rating: 1000,
  tags: ["math", "number-theory"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 12,
  statement: "A prime number is an integer greater than 1 that has no divisors other than 1 and itself. For each of t numbers, decide whether it is prime.",
  inputFormat: "The first line contains t. Each of the next t lines contains one integer n.",
  outputFormat: "For each n print `YES` if it is prime and `NO` otherwise.",
  constraints: "1 <= t <= 100\n1 <= n <= 10^9",
  samples: [{ input: "4\n1\n2\n15\n17\n", output: "NO\nYES\nNO\nYES\n", explanation: "1 is not prime. 15 = 3 * 5." }],
  hints: [
    "Try dividing n by smaller numbers. When does a divisor prove that n is not prime?",
    "If n has a divisor d > 1 with d < n, it also has one that is at most sqrt(n). So you only need to test up to sqrt(n).",
    "Handle n < 2 first. Then loop `for (long long d = 2; d * d <= n; d++)` and print NO if n % d == 0. Testing all numbers up to n is too slow for 10^9.",
  ],
  editorial: "Trial division up to sqrt(n): if n = a * b with 1 < a <= b, then a <= sqrt(n). For n = 10^9 that is about 31623 checks per number, so 100 numbers need about 3 * 10^6 operations. Looping up to n (10^9 steps) would exceed the time limit.\n\nWatch the edge cases: 1 is not prime, 2 is.\n\nComplexity: O(t * sqrt(n)).",
  reference: `#include <iostream>
using namespace std;
bool isPrime(long long n) {
    if (n < 2) return false;
    for (long long d = 2; d * d <= n; d++)
        if (n % d == 0) return false;
    return true;
}
int main() {
    int t;
    cin >> t;
    while (t--) {
        long long n;
        cin >> n;
        cout << (isPrime(n) ? "YES" : "NO") << "\\n";
    }
    return 0;
}`,
  hidden: () => {
    const r = rng(15);
    const nums = [1, 2, 3, 4, 9, 25, 49, 97, 999999937, 999999929, 1000000000, 999999999, 998244353, 1000000007 - 8, 961];
    const mk = (xs: number[]) => `${xs.length}\n${xs.join("\n")}\n`;
    const out = [mk(nums.slice(0, 8)), mk(nums.slice(8)), mk([999999937, 999999937, 999999929, 999999929]), mk([1])];
    for (let k = 0; k < 4; k++) out.push(mk(Array.from({ length: 100 }, () => r.int(1, 1e9))));
    out.push(mk(Array(100).fill(999999937)));
    return out;
  },
};

export const reverseArray: ProblemSeed = {
  slug: "reverse-the-array",
  title: "Reverse the Array",
  difficulty: "newbie",
  rating: 800,
  tags: ["arrays", "implementation"],
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  estimatedMinutes: 6,
  statement: "You are given an array of n integers. Print the elements in reverse order.",
  inputFormat: "The first line contains n. The second line contains n integers.",
  outputFormat: "Print the n integers in reverse order, separated by single spaces.",
  constraints: "1 <= n <= 10^5\n-10^9 <= a_i <= 10^9",
  samples: [{ input: "5\n1 2 3 4 5\n", output: "5 4 3 2 1\n" }, { input: "1\n42\n", output: "42\n" }],
  hints: [
    "You need to read all the numbers before you can print the last one first.",
    "Store the numbers in an array (vector) and print it from the end to the start.",
    "Use `vector<int> a(n)`, read in a loop, then `for (int i = n - 1; i >= 0; i--)` print a[i] with a space between values. Use fast input for n = 10^5.",
  ],
  editorial: "Store the values in a vector and print from index n-1 down to 0. Use `ios::sync_with_stdio(false); cin.tie(nullptr);` for fast I/O, although n = 10^5 is small.\n\nComplexity: O(n) time and memory.",
  reference: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    for (int i = n - 1; i >= 0; i--) cout << a[i] << (i ? ' ' : '\\n');
    return 0;
}`,
  hidden: () => {
    const r = rng(16);
    const mk = (n: number) => `${n}\n${Array.from({ length: n }, () => r.int(-1e9, 1e9)).join(" ")}\n`;
    return [mk(1), mk(2), mk(3), mk(10), mk(1000), mk(100000), mk(100000)];
  },
};
