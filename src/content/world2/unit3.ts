import { arrange, bug, fill, mc, predict, progh, tf } from "../builders";
import type { UnitSeed } from "../types";

const v = (body: string) => progh(["vector"], body);

export const w2unit3: UnitSeed = {
  slug: "vectors",
  title: "Vectors",
  description: "Resizable arrays: the container you will use most in contests.",
  icon: "ListOrdered",
  lessons: [
    {
      slug: "vector-basics",
      title: "Vector Basics",
      summary: "push_back, size and indexing.",
      content: {
        concept: "A vector is an array that can grow and shrink while the program runs.",
        explanation: [
          "Include <vector>. vector<int> a; is empty. vector<int> a(5); has five zeros. vector<int> a(5, 7); has five sevens.",
          "a.push_back(x) adds x at the end. a.pop_back() removes the last element. a.size() is the current length.",
          "a[i] works like an array. a.back() is the last element and a.front() the first.",
          "Read n numbers: vector<int> a(n); for (int &x : a) cin >> x;",
        ],
        syntax: "vector<int> a;\na.push_back(3);\ncout << a.size() << a[0];",
        example: { code: v("vector<int> a;\na.push_back(3);\na.push_back(8);\ncout << a.size() << a.back();"), output: "28" },
        commonMistakes: ["Indexing a[i] on an empty vector (undefined behaviour).", "Calling a.back() or pop_back() on an empty vector.", "Writing a[n] = x on a vector of size n instead of push_back."],
      },
      questions: [
        predict(v("vector<int> a;\na.push_back(3);\na.push_back(8);\ncout << a.size() << a.back();"), ["28", "38", "2", "83"], 0, "After two push_backs the size is 2 and the last element is 8."),
        predict(v("vector<int> a(3, 7);\ncout << a[0] + a[2];"), ["14", "7", "21", "0"], 0, "vector<int> a(3, 7) holds {7, 7, 7}."),
        predict(v("vector<int> a = {1, 2, 3};\na.pop_back();\ncout << a.size();"), ["2", "3", "1", "0"], 0, "pop_back removes one element, leaving size 2."),
        tf("vector<int> a(5); starts with five elements all equal to 0.", true, "Value-initialisation sets numeric elements to zero."),
        mc("Which loop reads n numbers into a vector a of size n?", ["for (int &x : a) cin >> x;", "for (int x : a) cin >> x;", "cin >> a;", "a.read(n);"], 0, "The reference (&) is needed so the value read is stored in the vector, not in a copy."),
        fill("Complete the code to add 10 to the end of a.", v("vector<int> a;\na.___(10);\ncout << a[0];"), ["push_back"], "push_back appends an element at the end.", ["push_back", "add", "append"]),
        bug("This code is undefined behaviour. Why?", v("vector<int> a;\na[0] = 5;"), ["The vector is empty, so index 0 does not exist yet", "vector cannot hold ints", "a needs a semicolon", "push_back is required for every assignment"], 0, "Indexing never grows a vector. Use push_back or create it with a size."),
      ],
    },
    {
      slug: "vector-iteration",
      title: "Iterating and Modifying Vectors",
      summary: "Range-for, insert, erase, clear and 2D vectors.",
      content: {
        concept: "Vectors support easy iteration and several ways to change their contents.",
        explanation: [
          "for (int x : a) visits copies; for (int &x : a) lets you change the elements; for (const int &x : a) avoids copies.",
          "a.clear() empties the vector. a.resize(k) changes the size. a.assign(k, v) refills it.",
          "a.insert(a.begin() + i, x) and a.erase(a.begin() + i) insert/delete in the middle, but cost O(n) because elements shift.",
          "vector<vector<int>> g(n, vector<int>(m)); is a flexible 2D grid.",
        ],
        syntax: "for (int &x : a) x *= 2;\na.erase(a.begin() + 1);",
        example: { code: v("vector<int> a = {1, 2, 3};\nfor (int &x : a) x *= 2;\nfor (int x : a) cout << x << \" \";"), output: "2 4 6 " },
        commonMistakes: ["Changing a copy by writing for (int x : a) x++;", "Erasing in a loop and skipping elements.", "Using insert/erase in the middle of a large vector inside a hot loop."],
      },
      questions: [
        predict(v("vector<int> a = {1, 2, 3};\nfor (int &x : a) x *= 2;\nfor (int x : a) cout << x << \" \";"), ["2 4 6", "1 2 3", "2 4 3", "6"], 0, "The reference lets the loop modify every element."),
        predict(v("vector<int> a = {1, 2, 3};\nfor (int x : a) x *= 2;\nfor (int x : a) cout << x << \" \";"), ["1 2 3", "2 4 6", "0 0 0", "Error"], 0, "Without &, x is a copy, so the vector is unchanged."),
        predict(v("vector<int> a = {10, 20, 30, 40};\na.erase(a.begin() + 1);\ncout << a[1] << \" \" << a.size();"), ["30 3", "20 3", "30 4", "40 3"], 0, "Erasing index 1 removes 20; the vector becomes {10, 30, 40}."),
        predict(v("vector<vector<int>> g(2, vector<int>(3, 1));\ng[1][2] = 9;\nint s = 0;\nfor (auto &row : g) for (int x : row) s += x;\ncout << s;"), ["14", "6", "9", "15"], 0, "Five ones plus one nine: 5 + 9 = 14."),
        mc("Why is erase in the middle of a big vector slow?", ["All later elements shift left, costing O(n)", "It allocates new memory every time", "It sorts the vector", "It is not slow"], 0, "Contiguous storage means the tail must be moved to close the gap."),
        arrange("Arrange the lines to double every element of vector a.", ["for (int &x : a) {", "    x *= 2;", "}"], "Loop by reference and multiply each element."),
      ],
    },
    {
      slug: "vector-vs-array",
      title: "Vectors vs Arrays and Passing to Functions",
      summary: "Choose the right tool and avoid accidental copies.",
      content: {
        concept: "Use arrays for fixed, known sizes and vectors when the size varies. Pass big vectors by reference.",
        explanation: [
          "Global arrays are fast and simple when the maximum size is known, for example int a[200005].",
          "Vectors adapt to n read at runtime and carry their own size.",
          "Passing a vector by value copies all its elements. Prefer const vector<int> &a for read-only parameters and vector<int> &a to modify the caller's vector.",
          "A function can also return a vector.",
        ],
        syntax: "int sum(const vector<int> &a) { ... }\nvoid addOne(vector<int> &a) { ... }",
        example: {
          code: progh(["vector"], "vector<int> a = {1, 2, 3};\ncout << sum(a);", "int sum(const vector<int> &a) {\n    int s = 0;\n    for (int x : a) s += x;\n    return s;\n}"),
          output: "6",
        },
        commonMistakes: ["Passing a large vector by value in a recursive function (very slow).", "Modifying a vector inside a function that took it by value and expecting the caller to see it."],
      },
      questions: [
        predict(progh(["vector"], "vector<int> a = {1, 2};\naddOne(a);\ncout << a.size();", "void addOne(vector<int> a) {\n    a.push_back(1);\n}"), ["2", "3", "1", "0"], 0, "a was passed by value, so the function changed only its own copy."),
        predict(progh(["vector"], "vector<int> a = {1, 2};\naddOne(a);\ncout << a.size();", "void addOne(vector<int> &a) {\n    a.push_back(1);\n}"), ["3", "2", "1", "Error"], 0, "Passing by reference lets the function modify the caller's vector."),
        mc("Which parameter type is best for a function that only reads a large vector?", ["const vector<int> &a", "vector<int> a", "vector<int> *a only", "int a[]"], 0, "A const reference avoids copying and prevents accidental changes."),
        tf("Passing a vector by value copies all its elements.", true, "That is why large vectors should be passed by reference."),
        mc("When is a plain global array a good choice?", ["The maximum size is known and fixed", "The size changes constantly", "You need push_back", "You need to return it from a function"], 0, "Fixed-size data with a known upper bound is the classic case."),
      ],
    },
  ],
};
