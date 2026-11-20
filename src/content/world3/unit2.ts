import { arrange, mc, predict, progh, tf } from "../builders";
import type { UnitSeed } from "../types";

export const w3unit2: UnitSeed = {
  slug: "set-map",
  title: "Set and Map",
  description: "Sorted, searchable collections and key-value lookup in O(log n), plus hash versions in O(1).",
  icon: "Database",
  lessons: [
    {
      slug: "set",
      title: "set and unordered_set",
      summary: "Unique values, kept sorted.",
      content: {
        concept: "A set stores unique values in sorted order. insert, erase and find take O(log n).",
        explanation: [
          "Include <set>. s.insert(x) ignores duplicates. s.count(x) is 0 or 1. s.erase(x) removes x.",
          "Iterating a set visits elements in increasing order. *s.begin() is the smallest and *s.rbegin() the largest.",
          "s.lower_bound(x) is the set version of binary search. Do not use std::lower_bound on a set: it is slow.",
          "unordered_set uses hashing: O(1) on average, but no ordering. multiset allows duplicates.",
        ],
        syntax: "set<int> s;\ns.insert(3);\nif (s.count(3)) {...}",
        example: { code: progh(["set"], "set<int> s;\ns.insert(5);\ns.insert(1);\ns.insert(5);\ncout << s.size() << *s.begin();"), output: "21" },
        commonMistakes: ["Expecting duplicates to be stored.", "Indexing a set with s[i] (not allowed).", "Using unordered_set when you need ordered iteration."],
      },
      questions: [
        predict(progh(["set"], "set<int> s;\ns.insert(5);\ns.insert(1);\ns.insert(5);\ncout << s.size() << *s.begin();"), ["21", "31", "25", "15"], 0, "Duplicates are ignored, so the set is {1, 5}: size 2, smallest 1."),
        predict(progh(["set"], "set<int> s = {4, 2, 9};\nfor (int x : s) cout << x;"), ["249", "429", "942", "294"], 0, "Iteration is in sorted order."),
        predict(progh(["set"], "set<int> s = {1, 3, 5};\ncout << s.count(3) << s.count(4);"), ["10", "01", "11", "00"], 0, "3 is present, 4 is not."),
        predict(progh(["set"], "set<int> s = {1, 3, 5, 7};\nauto it = s.lower_bound(4);\ncout << *it;"), ["5", "3", "4", "7"], 0, "lower_bound returns the first element >= 4, which is 5."),
        mc("What is the main difference between set and unordered_set?", ["set keeps sorted order, unordered_set does not", "set allows duplicates", "unordered_set is sorted", "There is none"], 0, "set is a balanced tree (sorted, O(log n)); unordered_set is a hash table (no order, O(1) average)."),
        tf("A std::set can hold the same value twice.", false, "Use multiset if you need duplicates."),
      ],
    },
    {
      slug: "map",
      title: "map and unordered_map",
      summary: "Key-value pairs for counting and lookup.",
      content: {
        concept: "A map associates each unique key with a value, sorted by key.",
        explanation: [
          "Include <map>. m[key] reads or creates the entry (a missing key is created with value 0 for ints).",
          "m.count(key) checks existence without creating it. m.erase(key) removes it.",
          "Iterating yields pairs in key order: for (auto &[k, v] : m).",
          "Counting frequencies is the classic use: for each x, m[x]++.",
          "unordered_map is the hash version: O(1) average, unordered. Hash tables can be attacked on some judges (e.g. Codeforces hacks), so many contestants use map or a custom hash.",
        ],
        syntax: "map<string, int> m;\nm[\"a\"]++;\nfor (auto &[k, v] : m) cout << k << v;",
        example: { code: progh(["map"], "map<int, int> m;\nint a[5] = {3, 1, 3, 3, 1};\nfor (int x : a) m[x]++;\nfor (auto &[k, v] : m) cout << k << \":\" << v << \" \";"), output: "1:2 3:3 " },
        commonMistakes: ["Reading m[key] just to check existence; it inserts the key.", "Forgetting that map iterates in sorted key order.", "Using an int as a counter without initialising (maps do initialise to 0)."],
      },
      questions: [
        predict(progh(["map"], "map<int, int> m;\nint a[5] = {3, 1, 3, 3, 1};\nfor (int x : a) m[x]++;\nfor (auto &[k, v] : m) cout << k << \":\" << v << \" \";"), ["1:2 3:3", "3:3 1:2", "1:3 3:2", "1:1 3:1"], 0, "Keys are visited in sorted order. 1 appears twice and 3 appears three times."),
        predict(progh(["map"], "map<int, int> m;\nif (m[7] == 0) cout << \"zero \";\ncout << m.size();"), ["zero 1", "zero 0", "1", "zero"], 0, "Reading m[7] creates the entry with value 0, so size becomes 1."),
        predict(progh(["map", "string"], "map<string, int> m;\nm[\"b\"] = 2;\nm[\"a\"] = 1;\ncout << m.begin()->first << m.begin()->second;"), ["a1", "b2", "a2", "b1"], 0, "The smallest key is \"a\" and its value is 1."),
        predict(progh(["map"], "map<int, int> m;\nm[1] = 5;\ncout << m.count(2) << m.size();"), ["01", "11", "00", "10"], 0, "count(2) does not create the key, so size stays 1."),
        mc("How do you test that key k exists without inserting it?", ["m.count(k)", "m[k]", "m.at(k) always", "m.insert(k)"], 0, "count (or find) does not modify the map; operator[] would create the entry."),
        tf("operator[] on a map inserts the key if it is missing.", true, "That is why [] should not be used for existence checks."),
        arrange("Arrange the lines to count occurrences of each number in vector a.", ["map<int, int> cnt;", "for (int x : a) {", "    cnt[x]++;", "}"], "Declare the map, loop through the values and increment each one's counter."),
      ],
    },
  ],
};
