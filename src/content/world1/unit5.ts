import { bug, fill, match, mc, predict, prog, tf } from "../builders";
import type { UnitSeed } from "../types";

export const unit5: UnitSeed = {
  slug: "loops",
  title: "Loops",
  description: "Repeat work with for, while and do-while, control loops, and estimate how long they take.",
  icon: "Repeat",
  lessons: [
    {
      slug: "for-and-while",
      title: "for and while Loops",
      summary: "Repeat code a fixed number of times or until a condition fails.",
      content: {
        concept: "A loop repeats a block of code. for suits counted loops, while suits 'until something happens'.",
        explanation: [
          "A for loop has three parts: initialisation, condition and update. for (int i = 1; i <= 5; i++) runs with i = 1, 2, 3, 4, 5.",
          "A while loop checks its condition before every pass. If the condition is false at the start, the body never runs.",
          "Make sure something inside the loop eventually makes the condition false, otherwise you get an infinite loop.",
        ],
        syntax: "for (int i = 0; i < n; i++) { ... }\nwhile (cond) { ... }",
        example: {
          code: prog('int sum = 0;\nfor (int i = 1; i <= 10; i++) {\n    sum += i;\n}\ncout << sum;'),
          output: "55",
          note: "1 + 2 + ... + 10 = 55.",
        },
        commonMistakes: ["Off-by-one errors: < n versus <= n.", "Forgetting to update the loop variable in a while loop."],
      },
      questions: [
        predict(prog('for (int i = 1; i <= 5; i++) {\n    cout << i << " ";\n}'), ["1 2 3 4 5", "0 1 2 3 4", "1 2 3 4", "2 3 4 5"], 0, "i starts at 1 and the loop runs while i <= 5."),
        predict(prog('int sum = 0;\nfor (int i = 1; i <= 10; i++) sum += i;\ncout << sum;'), ["45", "55", "10", "100"], 1, "1 + 2 + ... + 10 = 55."),
        predict(prog('int n = 1;\nwhile (n < 100) {\n    n *= 2;\n}\ncout << n;'), ["100", "64", "128", "256"], 2, "n doubles: 1, 2, 4, 8, 16, 32, 64, 128. The first value that is not < 100 is 128."),
        predict(prog('for (int i = 0; i < 3; i++) {\n    cout << i;\n}'), ["012", "123", "0123", "0 1 2"], 0, "i takes the values 0, 1, 2 and the loop stops when i reaches 3."),
        bug("This loop never ends. Why?", prog('int i = 0;\nwhile (i < 5) {\n    cout << i;\n}'), ["i is never changed inside the loop", "while needs a semicolon", "i must be double", "cout is wrong"], 0, "The condition i < 5 stays true forever because nothing updates i. Add i++ inside the loop."),
        fill("Complete the loop so it prints 0 to 4.", prog('for (int i = 0; i ___ 5; i++) cout << i;'), ["<"], "Use < 5 to stop before 5.", ["<", "<=", ">"]),
      ],
    },
    {
      slug: "do-while-break-continue",
      title: "do while, break and continue",
      summary: "Run at least once, leave early, or skip an iteration.",
      content: {
        concept: "do while checks its condition after the body. break leaves a loop, continue skips to the next iteration.",
        explanation: [
          "do { ... } while (cond); always runs the body at least once.",
          "break exits the nearest loop immediately.",
          "continue skips the rest of the current iteration and jumps to the next one (in a for loop, the update still runs).",
        ],
        syntax: "do { ... } while (cond);\nif (x) break;\nif (y) continue;",
        example: {
          code: prog('for (int i = 1; i <= 5; i++) {\n    if (i % 2 == 0) continue;\n    cout << i << " ";\n}'),
          output: "1 3 5",
          note: "Even numbers are skipped.",
        },
        commonMistakes: ["Forgetting the semicolon after while (cond) in a do-while.", "Using continue in a while loop before the counter update, which can cause an infinite loop."],
      },
      questions: [
        predict(prog('int i = 10;\ndo {\n    cout << i << " ";\n    i++;\n} while (i < 5);'), ["nothing", "10", "10 11 12 13 14", "5"], 1, "A do-while runs the body once before testing the condition."),
        predict(prog('for (int i = 1; i <= 10; i++) {\n    if (i == 4) break;\n    cout << i << " ";\n}'), ["1 2 3", "1 2 3 4", "4", "1 2 3 5 6 7 8 9 10"], 0, "When i reaches 4, break ends the loop before printing."),
        predict(prog('for (int i = 1; i <= 5; i++) {\n    if (i % 2 == 0) continue;\n    cout << i << " ";\n}'), ["2 4", "1 3 5", "1 2 3 4 5", "1 5"], 1, "continue skips even values, so only odd numbers are printed."),
        mc("What is the difference between break and continue?", ["break leaves the loop, continue goes to the next iteration", "They are the same", "continue leaves the loop, break skips an iteration", "break only works in while"], 0, "break ends the whole loop. continue only ends the current pass."),
        tf("A do-while loop body always runs at least once.", true, "The condition is checked after the body."),
      ],
    },
    {
      slug: "nested-loops-and-complexity",
      title: "Nested Loops and Complexity",
      summary: "Loops inside loops, and a first look at how work grows.",
      content: {
        concept: "A nested loop runs its inner loop completely for every pass of the outer loop. Counting iterations estimates running time.",
        explanation: [
          "If the outer loop runs n times and the inner loop runs m times, the body executes n * m times.",
          "Competitive programming judges typically allow about 10^8 simple operations per second. A single loop over n = 10^5 is fine, but a nested loop over n = 10^5 is 10^10 operations, far too slow.",
          "We describe this growth as time complexity: O(n) for one loop, O(n^2) for a double loop. You will study this properly in World 4.",
        ],
        syntax: "for (int i = 1; i <= n; i++)\n    for (int j = 1; j <= n; j++) { ... }",
        example: {
          code: prog('for (int i = 1; i <= 3; i++) {\n    for (int j = 1; j <= i; j++) cout << "*";\n    cout << " ";\n}'),
          output: "* ** ***",
          note: "The inner loop length depends on i, which draws a triangle.",
        },
        commonMistakes: ["Reusing the same variable name for both loops.", "Not estimating how many operations a nested loop performs before submitting."],
      },
      questions: [
        predict(prog('for (int i = 1; i <= 3; i++) {\n    for (int j = 1; j <= i; j++) cout << "*";\n    cout << " ";\n}'), ["* ** ***", "*** ** *", "*** *** ***", "* * *"], 0, "Row i prints i stars: 1, 2, 3."),
        predict(prog('int count = 0;\nfor (int i = 0; i < 4; i++)\n    for (int j = 0; j < 5; j++) count++;\ncout << count;'), ["9", "20", "5", "4"], 1, "4 outer passes times 5 inner passes = 20."),
        mc("n = 100000 and you use two nested loops that each run n times. Roughly how many operations?", ["10^10", "10^5", "2 * 10^5", "10^7"], 0, "n * n = 10^5 * 10^5 = 10^10, which is far too slow for a one-second limit."),
        mc("About how many simple operations can a typical judge do per second?", ["About 10^8", "About 10^3", "About 10^12", "About 10^15"], 0, "A common rule of thumb in competitive programming is around 10^8 simple operations per second."),
        match("Match the loop with its iteration count for n = 10.", [["for (i=0;i<n;i++)", "10 passes"], ["Two nested loops over n", "100 passes"], ["for (i=1;i<=n;i*=2)", "4 passes"], ["do { } while (false);", "1 pass"]], "The doubling loop runs for i = 1, 2, 4, 8, which is about log2(n) passes."),
      ],
    },
  ],
};
