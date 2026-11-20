import { arrange, bug, fill, mc, predict, progh, tf } from "../builders";
import type { UnitSeed } from "../types";

const p = (body: string, pre = "") => progh([], body, pre);

export const w2unit1: UnitSeed = {
  slug: "arrays",
  title: "Arrays",
  description: "Store many values of the same type and walk through them with loops.",
  icon: "LayoutGrid",
  lessons: [
    {
      slug: "array-basics",
      title: "Array Basics",
      summary: "Declare, fill and read fixed-size arrays.",
      content: {
        concept: "An array stores a fixed number of values of the same type in consecutive memory.",
        explanation: [
          "int a[5]; creates five ints. Valid indices are 0 to 4, because counting starts at 0.",
          "You can initialise an array: int a[5] = {1, 2, 3, 4, 5}; Missing values are filled with 0.",
          "Reading or writing outside the valid range is undefined behaviour: it may crash or silently corrupt other data. The compiler will not stop you.",
          "In competitive programming, arrays are usually declared globally with a size a little larger than the maximum n.",
        ],
        syntax: "int a[5] = {1, 2, 3};\na[0] = 10;\ncout << a[4];",
        example: { code: p("int a[5] = {1, 2, 3};\ncout << a[0] << \" \" << a[3];"), output: "1 0", note: "a[3] was not listed, so it is 0." },
        commonMistakes: ["Using a[n] when valid indices are 0..n-1.", "Declaring a[100] and then reading 200 numbers.", "Forgetting that a local array without {} contains garbage."],
      },
      questions: [
        mc("If int a[10]; is declared, which index is the last valid one?", ["9", "10", "11", "1"], 0, "A size-10 array has indices 0 through 9."),
        predict(p("int a[5] = {1, 2, 3};\ncout << a[0] << \" \" << a[3];"), ["1 0", "1 3", "1 garbage", "Error"], 0, "Elements not listed in the initialiser are set to 0."),
        predict(p("int a[4] = {5, 6, 7, 8};\ncout << a[1] + a[2];"), ["13", "11", "12", "6 7"], 0, "a[1] is 6 and a[2] is 7, so the sum is 13."),
        tf("Accessing a[5] on an array declared int a[5]; is checked by the compiler and always produces an error.", false, "C++ does not check bounds. It is undefined behaviour, which may crash or silently misbehave."),
        fill("Complete the code to set the first element to 42.", p("int a[3];\n___ = 42;\ncout << a[0];"), ["a[0]"], "The first element has index 0.", ["a[0]", "a[1]", "a[3]"]),
        bug("This program reads one element past the end. Why?", p("int a[3] = {1, 2, 3};\nfor (int i = 0; i <= 3; i++) cout << a[i];"), ["i <= 3 lets i reach 3, which is out of range", "The array must be double", "cout cannot print ints", "The loop never starts"], 0, "Valid indices are 0..2, so the condition should be i < 3."),
      ],
    },
    {
      slug: "loops-over-arrays",
      title: "Looping Over Arrays",
      summary: "Sum, maximum and counting patterns.",
      content: {
        concept: "Almost every array task is a loop over the indices that keeps some running result.",
        explanation: [
          "Sum: start with 0 and add each element.",
          "Maximum: start with the first element and replace it whenever you see a bigger one.",
          "Counting: increase a counter when an element satisfies a condition.",
          "A range-based for loop, for (int x : a), visits each element without an index when you do not need one.",
        ],
        syntax: "int sum = 0;\nfor (int i = 0; i < n; i++) sum += a[i];",
        example: { code: p("int a[5] = {3, 8, 1, 9, 4};\nint mx = a[0];\nfor (int i = 1; i < 5; i++) if (a[i] > mx) mx = a[i];\ncout << mx;"), output: "9" },
        commonMistakes: ["Starting the maximum at 0 when all numbers can be negative.", "Forgetting to reset the sum before a second pass.", "Overflowing int when the sum is large; use long long."],
      },
      questions: [
        predict(p("int a[4] = {2, 4, 6, 8};\nint s = 0;\nfor (int i = 0; i < 4; i++) s += a[i];\ncout << s;"), ["20", "8", "12", "2468"], 0, "2 + 4 + 6 + 8 = 20."),
        predict(p("int a[5] = {3, 8, 1, 9, 4};\nint mx = a[0];\nfor (int i = 1; i < 5; i++) if (a[i] > mx) mx = a[i];\ncout << mx;"), ["9", "3", "8", "4"], 0, "mx is replaced by 8 then by 9; nothing later is bigger."),
        predict(p("int a[6] = {1, 2, 3, 4, 5, 6};\nint c = 0;\nfor (int x : a) if (x % 2 == 0) c++;\ncout << c;"), ["3", "6", "2", "12"], 0, "The even numbers are 2, 4 and 6, so the counter ends at 3."),
        mc("Why is starting mx = 0 risky when searching for the maximum?", ["All numbers might be negative, so 0 would wrongly win", "0 is not a valid int", "It makes the loop slower", "The loop would not compile"], 0, "If every element is below 0, the answer would be reported as 0, which is not in the array."),
        arrange("Arrange the lines to compute the sum of a[0..n-1].", ["long long sum = 0;", "for (int i = 0; i < n; i++) {", "    sum += a[i];", "}"], "Initialise first, then loop and accumulate."),
      ],
    },
    {
      slug: "two-d-arrays",
      title: "Two-Dimensional Arrays",
      summary: "Grids and tables with a[row][col].",
      content: {
        concept: "A 2D array is a table: a[i][j] is row i, column j.",
        explanation: [
          "int g[3][4]; has 3 rows and 4 columns.",
          "Use nested loops: the outer loop walks rows, the inner loop walks columns.",
          "Grids appear constantly in contest problems: maps, boards, mazes and DP tables.",
          "Neighbours of (i, j) are (i-1, j), (i+1, j), (i, j-1) and (i, j+1). Always check bounds before using them.",
        ],
        syntax: "int g[3][4] = {};\nfor (int i = 0; i < 3; i++)\n    for (int j = 0; j < 4; j++)\n        g[i][j] = i * j;",
        example: { code: p("int g[2][3] = {{1, 2, 3}, {4, 5, 6}};\ncout << g[1][0];"), output: "4", note: "Row 1, column 0." },
        commonMistakes: ["Swapping row and column indices.", "Forgetting bounds checks on neighbours.", "Declaring a huge 2D array locally, which can overflow the stack. Make it global."],
      },
      questions: [
        predict(p("int g[2][3] = {{1, 2, 3}, {4, 5, 6}};\ncout << g[1][0];"), ["4", "2", "3", "1"], 0, "g[1] is the second row {4, 5, 6}; its first element is 4."),
        predict(p("int g[2][2] = {{1, 2}, {3, 4}};\nint s = 0;\nfor (int i = 0; i < 2; i++) s += g[i][i];\ncout << s;"), ["5", "10", "4", "3"], 0, "The diagonal holds 1 and 4."),
        mc("In int g[5][7]; how many elements are there?", ["35", "12", "5", "7"], 0, "5 rows times 7 columns is 35."),
        tf("In a[i][j], the first index usually selects the row.", true, "By convention a[row][column]."),
        fill("Complete the inner loop so it visits every column of a grid with m columns.", p("int m = 3;\nfor (int j = 0; j ___ m; j++) cout << j;"), ["<"], "Columns are 0..m-1, so the condition is j < m.", ["<", "<=", "=="]),
      ],
    },
  ],
};
