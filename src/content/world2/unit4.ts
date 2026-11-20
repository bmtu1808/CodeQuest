import { bug, fill, mc, predict, progh, tf } from "../builders";
import type { UnitSeed } from "../types";

const a = (body: string, pre = "") => progh(["vector", "algorithm"], body, pre);

export const w2unit4: UnitSeed = {
  slug: "sorting-searching",
  title: "Sorting and Searching",
  description: "std::sort, custom ordering, binary search and the lower_bound family.",
  icon: "ArrowUpDown",
  lessons: [
    {
      slug: "std-sort",
      title: "Sorting with std::sort",
      summary: "Sort vectors and arrays in O(n log n).",
      content: {
        concept: "std::sort rearranges a range into increasing order in O(n log n) time.",
        explanation: [
          "Include <algorithm>. For a vector: sort(a.begin(), a.end()). For an array of n elements: sort(a, a + n).",
          "For decreasing order pass greater<int>(): sort(a.begin(), a.end(), greater<int>()).",
          "Sorting is often the first step of a solution: after sorting, equal values sit together and neighbours are the closest values.",
          "reverse(a.begin(), a.end()) reverses a range.",
        ],
        syntax: "sort(a.begin(), a.end());\nsort(a.begin(), a.end(), greater<int>());",
        example: { code: a("vector<int> v = {4, 1, 3};\nsort(v.begin(), v.end());\nfor (int x : v) cout << x;"), output: "134" },
        commonMistakes: ["Writing sort(a, a + n - 1) and leaving the last element out.", "Sorting with <= in a custom comparator (it must be a strict ordering).", "Forgetting #include <algorithm>."],
      },
      questions: [
        predict(a("vector<int> v = {4, 1, 3};\nsort(v.begin(), v.end());\nfor (int x : v) cout << x;"), ["134", "431", "413", "341"], 0, "The vector becomes {1, 3, 4}."),
        predict(a("vector<int> v = {4, 1, 3};\nsort(v.begin(), v.end(), greater<int>());\nfor (int x : v) cout << x;"), ["431", "134", "413", "143"], 0, "greater<int>() sorts in decreasing order."),
        predict(a("int arr[5] = {5, 2, 9, 1, 7};\nsort(arr, arr + 5);\ncout << arr[0] << arr[4];"), ["19", "59", "91", "17"], 0, "Sorted: 1 2 5 7 9; the first is 1 and the last is 9."),
        predict(a("vector<int> v = {1, 2, 3};\nreverse(v.begin(), v.end());\ncout << v[0];"), ["3", "1", "2", "123"], 0, "reverse flips the order, so v[0] becomes 3."),
        mc("What is the time complexity of std::sort on n elements?", ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], 0, "std::sort runs in O(n log n)."),
        fill("Complete the call that sorts an array a of n ints.", a("int a[3] = {3, 1, 2};\nint n = 3;\nsort(a, a + ___);\ncout << a[0];"), ["n"], "The end pointer is a + n: one past the last element.", ["n", "n - 1", "n + 1"]),
        bug("The last element is never sorted. Why?", a("int a[4] = {4, 3, 2, 1};\nsort(a, a + 3);"), ["The end of the range is exclusive, so it should be a + 4", "sort only works on vectors", "int arrays cannot be sorted", "It must be sort(a + 3)"], 0, "The range is [first, last): a + 3 excludes a[3]."),
      ],
    },
    {
      slug: "custom-sort",
      title: "Custom Ordering",
      summary: "Comparators, lambdas and sorting pairs.",
      content: {
        concept: "You can tell sort how to compare two items by passing a comparator function or lambda.",
        explanation: [
          "A comparator takes two elements and returns true when the first must come before the second.",
          "Lambda syntax: [](int x, int y) { return x > y; }",
          "pair<int,int> compares by first, then by second. That makes sorting pairs very handy.",
          "A comparator must be a strict weak ordering: comp(x, x) must be false. Using <= can crash the program.",
        ],
        syntax: "sort(v.begin(), v.end(), [](int x, int y) { return x > y; });",
        example: { code: a("vector<pair<int,int>> p = {{2, 5}, {1, 9}, {2, 1}};\nsort(p.begin(), p.end());\ncout << p[0].first << p[1].second;"), output: "11" , note: "Sorted order: (1,9), (2,1), (2,5)."},
        commonMistakes: ["Returning true for equal elements (using <=).", "Comparing only one field when ties need breaking.", "Copying heavy objects in the comparator instead of using const references."],
      },
      questions: [
        predict(a("vector<int> v = {3, 1, 2};\nsort(v.begin(), v.end(), [](int x, int y) { return x > y; });\nfor (int t : v) cout << t;"), ["321", "123", "312", "231"], 0, "The lambda says x goes first when it is larger, giving decreasing order."),
        predict(a("vector<pair<int,int>> p = {{2, 5}, {1, 9}, {2, 1}};\nsort(p.begin(), p.end());\ncout << p[0].first << p[1].second;"), ["11", "19", "25", "21"], 0, "Pairs sort by first, then second: (1,9), (2,1), (2,5). p[0].first = 1 and p[1].second = 1."),
        predict(a("vector<int> v = {-3, 2, -1};\nsort(v.begin(), v.end(), [](int x, int y) { return abs(x) < abs(y); });\ncout << v[0] << v[2];"), ["-1-3", "-3-1", "2-3", "-12"], 0, "Sorted by absolute value: -1, 2, -3."),
        mc("What must a sort comparator return for two equal elements?", ["false", "true", "0 only", "It does not matter"], 0, "Strict ordering requires comp(x, x) == false. Returning true can break sort."),
        tf("pair<int,int> values compare by first, and by second only when the firsts are equal.", true, "That is the lexicographic comparison pairs use."),
        match2(),
      ],
    },
    {
      slug: "binary-search",
      title: "Binary Search",
      summary: "binary_search, lower_bound, upper_bound in O(log n).",
      content: {
        concept: "On a sorted range you can find a value in O(log n) by repeatedly halving the search range.",
        explanation: [
          "binary_search(first, last, x) tells whether x exists in the sorted range.",
          "lower_bound(first, last, x) returns an iterator to the first element >= x.",
          "upper_bound(first, last, x) returns an iterator to the first element > x.",
          "The number of elements equal to x is upper_bound - lower_bound. The index of an iterator it is it - v.begin().",
          "Binary search also solves 'find the smallest answer that works' problems when feasibility is monotone.",
        ],
        syntax: "int i = lower_bound(v.begin(), v.end(), x) - v.begin();",
        example: { code: a("vector<int> v = {1, 3, 3, 5, 8};\ncout << lower_bound(v.begin(), v.end(), 3) - v.begin();"), output: "1" },
        commonMistakes: ["Calling binary search on an unsorted array.", "Dereferencing the iterator when it equals end().", "Off-by-one errors in hand-written binary search loops."],
      },
      questions: [
        predict(a("vector<int> v = {1, 3, 3, 5, 8};\ncout << lower_bound(v.begin(), v.end(), 3) - v.begin();"), ["1", "2", "3", "0"], 0, "The first element >= 3 is at index 1."),
        predict(a("vector<int> v = {1, 3, 3, 5, 8};\ncout << upper_bound(v.begin(), v.end(), 3) - v.begin();"), ["3", "1", "2", "4"], 0, "The first element > 3 is the 5, at index 3."),
        predict(a("vector<int> v = {1, 3, 3, 5, 8};\ncout << upper_bound(v.begin(), v.end(), 3) - lower_bound(v.begin(), v.end(), 3);"), ["2", "1", "3", "0"], 0, "Two elements equal 3, so the difference is 2."),
        predict(a("vector<int> v = {2, 4, 6};\ncout << binary_search(v.begin(), v.end(), 5);"), ["0", "1", "5", "2"], 0, "5 is not in the vector, so binary_search returns false (printed as 0)."),
        predict(a("vector<int> v = {2, 4, 6};\ncout << lower_bound(v.begin(), v.end(), 7) - v.begin();"), ["3", "2", "-1", "0"], 0, "No element is >= 7, so lower_bound returns end(), whose index is the size, 3."),
        mc("What does binary search require?", ["A sorted range", "Distinct elements", "An even number of elements", "A vector, never an array"], 0, "The halving logic only works when the data is ordered."),
        mc("How many steps does binary search need for about one million elements?", ["About 20", "About 1000", "About 500000", "1"], 0, "log2(1,000,000) is about 20."),
      ],
    },
  ],
};

function match2() {
  return mc("Which comparator sorts strings by length, shortest first?", ["[](const string &x, const string &y) { return x.size() < y.size(); }", "[](string x, string y) { return x == y; }", "[](int x, int y) { return x; }", "greater<string>()"], 0, "It returns true when x is shorter than y, which places shorter strings first.");
}
