import { fill, mc, match, predict, progh, tf } from "../builders";
import type { UnitSeed } from "../types";

export const w3unit3: UnitSeed = {
  slug: "priority-queue-pairs",
  title: "Priority Queue, Pairs and Complexity",
  description: "Always get the biggest or smallest element fast, and judge whether a solution is fast enough.",
  icon: "Gauge",
  lessons: [
    {
      slug: "priority-queue",
      title: "priority_queue",
      summary: "A heap that serves the largest (or smallest) element first.",
      content: {
        concept: "A priority_queue always gives you the maximum element in O(1) and inserts or removes in O(log n).",
        explanation: [
          "Include <queue>. priority_queue<int> pq; is a max-heap: top() is the largest value.",
          "For a min-heap write priority_queue<int, vector<int>, greater<int>> pq;",
          "Operations: push(x), top(), pop(), empty(), size().",
          "It is the engine of Dijkstra's shortest paths, scheduling, merging sorted lists and 'k largest' problems.",
          "Trick: to get a min-heap of ints you can also push -x into a max-heap.",
        ],
        syntax: "priority_queue<int> pq;\npq.push(3);\ncout << pq.top();",
        example: { code: progh(["queue"], "priority_queue<int> pq;\npq.push(3);\npq.push(9);\npq.push(5);\ncout << pq.top();\npq.pop();\ncout << pq.top();"), output: "95" },
        commonMistakes: ["Forgetting that the default is a max-heap.", "Calling top() on an empty heap.", "Trying to iterate or search a priority_queue."],
      },
      questions: [
        predict(progh(["queue"], "priority_queue<int> pq;\npq.push(3);\npq.push(9);\npq.push(5);\ncout << pq.top();\npq.pop();\ncout << pq.top();"), ["95", "35", "93", "59"], 0, "The max is 9; after popping it the max is 5."),
        predict(progh(["queue", "vector"], "priority_queue<int, vector<int>, greater<int>> pq;\npq.push(3);\npq.push(9);\npq.push(5);\ncout << pq.top();"), ["3", "9", "5", "Error"], 0, "greater<int> turns it into a min-heap, so the smallest value is on top."),
        predict(progh(["queue"], "priority_queue<int> pq;\nfor (int x : {4, 8, 1}) pq.push(-x);\ncout << -pq.top();"), ["1", "8", "4", "-1"], 0, "Pushing negatives makes the largest negative (-1) the top; negating again gives 1."),
        mc("What is the cost of push on a priority_queue with n elements?", ["O(log n)", "O(1)", "O(n)", "O(n log n)"], 0, "A heap insertion bubbles up through log n levels."),
        tf("priority_queue<int> returns the smallest element from top() by default.", false, "By default it is a max-heap: top() is the largest."),
        mc("Which problem is a natural fit for a priority_queue?", ["Repeatedly take the cheapest available edge/task", "Check bracket balance", "Binary search a sorted array", "Reverse a string"], 0, "Heaps give fast access to the current best element, as in Dijkstra or scheduling."),
      ],
    },
    {
      slug: "pairs-tuples",
      title: "pair and tuple",
      summary: "Bundle values together without writing a struct.",
      content: {
        concept: "pair<A,B> holds two values; tuple holds more. They compare lexicographically.",
        explanation: [
          "make_pair(a, b) or {a, b} creates a pair. Access with .first and .second.",
          "Pairs work as keys in sets and maps, and as elements in vectors you want to sort.",
          "With structured bindings you can unpack: auto [x, y] = p;",
          "Sorting vector<pair<int,int>> orders by first, then second. Store (distance, node) in a min-heap for Dijkstra.",
        ],
        syntax: "pair<int,int> p = {3, 7};\ncout << p.first << p.second;",
        example: { code: progh(["utility"], "pair<int,int> p = {3, 7};\nauto [x, y] = p;\ncout << x + y;"), output: "10" },
        commonMistakes: ["Mixing up first and second.", "Forgetting that pair comparison checks first before second."],
      },
      questions: [
        predict(progh(["utility"], "pair<int,int> p = {3, 7};\nauto [x, y] = p;\ncout << x + y;"), ["10", "37", "21", "4"], 0, "x is 3 and y is 7, so the sum is 10."),
        predict(progh(["utility"], "pair<int,int> a = {1, 9}, b = {2, 0};\ncout << (a < b);"), ["1", "0", "9", "2"], 0, "The first components decide: 1 < 2 so a < b is true."),
        predict(progh(["queue", "vector", "utility"], "priority_queue<pair<int,int>> pq;\npq.push({2, 1});\npq.push({5, 0});\npq.push({5, 3});\ncout << pq.top().first << pq.top().second;"), ["53", "50", "21", "30"], 0, "In a max-heap of pairs the largest pair is (5, 3): ties on first are broken by second."),
        tf("A pair can be used as a std::set element.", true, "Pairs have a built-in ordering, so they work in sets and as map keys."),
        fill("Complete the access to the second component.", progh(["utility"], "pair<int,int> p = {1, 2};\ncout << p.___;"), ["second"], "A pair has .first and .second.", ["second", "next", "two"]),
      ],
    },
    {
      slug: "complexity",
      title: "Time Complexity and Limits",
      summary: "Estimate whether your solution will pass in time.",
      content: {
        concept: "A judge allows roughly 10^8 simple operations per second. Compare your algorithm's operation count with the limit.",
        explanation: [
          "Big-O describes how running time grows with input size n, ignoring constants.",
          "Rules of thumb for 1 second: n up to 10^5 or 10^6 needs O(n) or O(n log n); n up to 5000 allows O(n^2); n up to 20 allows O(2^n); n up to 10^18 needs O(log n) or O(1).",
          "Nested loops multiply: two loops of n each give n^2 operations.",
          "Space matters too: an int array of 10^7 elements uses about 40 MB.",
          "Read the constraints first. They tell you which complexity the problem setter expects.",
        ],
        syntax: "O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(2^n)",
        example: { code: progh([], "long long ops = 0;\nint n = 1000;\nfor (int i = 0; i < n; i++)\n    for (int j = 0; j < n; j++) ops++;\ncout << ops;"), output: "1000000", note: "Two nested loops of 1000 do one million steps." },
        commonMistakes: ["Submitting O(n^2) for n = 10^5 and getting Time Limit Exceeded.", "Ignoring that map/set operations cost O(log n), not O(1).", "Using int for a count that can reach 10^10."],
      },
      questions: [
        predict(progh([], "long long ops = 0;\nint n = 1000;\nfor (int i = 0; i < n; i++)\n    for (int j = 0; j < n; j++) ops++;\ncout << ops;"), ["1000000", "2000", "1000", "10000"], 0, "1000 * 1000 = 1,000,000 iterations."),
        mc("n = 200000. Which complexity is realistic for a 1 second limit?", ["O(n log n)", "O(n^2)", "O(n^3)", "O(2^n)"], 0, "n^2 would be 4*10^10 operations, far too many. n log n is about 3.5 million."),
        mc("n = 20. Which approach could pass?", ["Trying all 2^n subsets", "Nothing; it is too big", "Only O(1)", "Only O(log n)"], 0, "2^20 is about a million, which is fine."),
        mc("What is the complexity of this loop? for (int i = 1; i < n; i *= 2) {...}", ["O(log n)", "O(n)", "O(n^2)", "O(1)"], 0, "i doubles each time, so it runs about log2(n) times."),
        tf("A solution with 10^10 simple operations will usually run within 1 second.", false, "Judges handle roughly 10^8 to 10^9 simple operations per second. 10^10 is too slow."),
        match3(),
      ],
    },
  ],
};

function match3() {
  return match("Match the constraint with a typical intended complexity.", [["n <= 20", "O(2^n)"], ["n <= 5000", "O(n^2)"], ["n <= 10^5", "O(n log n)"], ["n <= 10^18", "O(log n)"]], "Larger limits force faster algorithms.");
}
