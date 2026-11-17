import { arrange, bug, fill, match, mc, predict, prog, tf } from "../builders";
import type { UnitSeed } from "../types";

export const unit4: UnitSeed = {
  slug: "conditionals",
  title: "Conditional Statements",
  description: "Make your programs decide: if, else, else if, switch and the ternary operator.",
  icon: "GitBranch",
  lessons: [
    {
      slug: "if-and-else",
      title: "if and else",
      summary: "Run code only when a condition is true.",
      content: {
        concept: "An if statement runs a block only when its condition is true. else runs when it is false.",
        explanation: [
          "The condition goes in parentheses. The block goes in braces. Always use braces, even for one statement, to avoid subtle bugs.",
          "else is optional and handles the case where the condition is false.",
          "Any value works as a condition: 0 is false, every other number is true.",
        ],
        syntax: "if (condition) {\n    // when true\n} else {\n    // when false\n}",
        example: {
          code: prog('int n = 7;\nif (n % 2 == 0) {\n    cout << "even";\n} else {\n    cout << "odd";\n}'),
          output: "odd",
        },
        commonMistakes: ["Putting a semicolon right after the condition: if (x > 5); ...", "Using = instead of == in the condition."],
      },
      questions: [
        predict(prog('int n = 7;\nif (n % 2 == 0) {\n    cout << "even";\n} else {\n    cout << "odd";\n}'), ["even", "odd", "7", "Error"], 1, "7 % 2 is 1, not 0, so the else branch runs."),
        predict(prog('int x = 10;\nif (x > 5) cout << "A";\nif (x > 8) cout << "B";\nif (x > 20) cout << "C";'), ["A", "AB", "ABC", "B"], 1, "Each if is checked independently. x > 5 and x > 8 are true, x > 20 is false."),
        bug("This program prints 'big' even for small x. Why?", prog('int x = 1;\nif (x > 5);\n{\n    cout << "big";\n}'), ["The semicolon after the condition ends the if", "x must be double", "Braces are not allowed here", "cout needs endl"], 0, "if (x > 5); is an if with an empty body. The block after it always runs."),
        fill("Complete the condition: print yes when n is positive.", prog('int n = 4;\nif (n ___ 0) cout << "yes";'), [">"], "A positive number is greater than 0.", [">", "<", "=="]),
        tf("In C++, the condition of an if can be any integer, where 0 means false.", true, "Zero converts to false, any other value converts to true."),
      ],
    },
    {
      slug: "else-if-and-nesting",
      title: "else if and Nested Conditions",
      summary: "Choose between several outcomes.",
      content: {
        concept: "else if chains test conditions in order. The first true one wins.",
        explanation: [
          "Conditions are checked from top to bottom. As soon as one is true, its block runs and the rest of the chain is skipped.",
          "Because of that, order matters: test the most specific or highest threshold first.",
          "You can also put an if inside another if (nesting), but long chains of else if are usually clearer.",
        ],
        syntax: "if (a) {...}\nelse if (b) {...}\nelse {...}",
        example: {
          code: prog('int score = 85;\nif (score >= 90) cout << "A";\nelse if (score >= 80) cout << "B";\nelse cout << "C";'),
          output: "B",
          note: "85 fails the first test, passes the second, and the else is skipped.",
        },
        commonMistakes: ["Putting the checks in the wrong order (e.g. >= 50 before >= 90).", "Forgetting the final else, leaving some inputs unhandled."],
      },
      questions: [
        predict(prog('int score = 85;\nif (score >= 90) cout << "A";\nelse if (score >= 80) cout << "B";\nelse cout << "C";'), ["A", "B", "C", "AB"], 1, "The first true condition (score >= 80) runs and the chain stops."),
        predict(prog('int s = 95;\nif (s >= 50) cout << "pass";\nelse if (s >= 90) cout << "top";'), ["top", "pass", "pass top", "nothing"], 1, "s >= 50 is true first, so 'top' can never be reached. Order matters."),
        predict(prog('int a = 3, b = 3;\nif (a > b) cout << "greater";\nelse if (a < b) cout << "less";\nelse cout << "equal";'), ["greater", "less", "equal", "Error"], 2, "Neither a > b nor a < b is true, so the else runs."),
        mc("Which condition is true exactly when x is between 1 and 10, inclusive?", ["x >= 1 && x <= 10", "x >= 1 || x <= 10", "1 <= x <= 10", "x > 1 && x < 10"], 0, "You need both bounds to hold, so use && with >= and <=."),
        arrange("Arrange the lines to print the sign of n.", ["if (n > 0) cout << \"positive\";", "else if (n < 0) cout << \"negative\";", "else cout << \"zero\";"], "Start with the first test, then else if, then the final else."),
      ],
    },
    {
      slug: "switch-and-ternary",
      title: "switch and the Ternary Operator",
      summary: "Compact ways to choose a value or a branch.",
      content: {
        concept: "switch picks a branch by matching one value. The ternary operator picks one of two values.",
        explanation: [
          "switch (x) compares x with each case label. Execution jumps to the matching case and keeps going until it meets break.",
          "Forgetting break makes execution 'fall through' into the next case. Use that only on purpose.",
          "default runs when no case matches.",
          "The ternary operator condition ? a : b gives a when the condition is true and b otherwise. It is handy for short choices like max.",
        ],
        syntax: "switch (day) {\n    case 1: ...; break;\n    default: ...;\n}\nint m = (a > b) ? a : b;",
        example: {
          code: prog('int a = 3, b = 9;\ncout << (a > b ? a : b);'),
          output: "9",
          note: "This is the maximum of a and b.",
        },
        commonMistakes: ["Forgetting break in a switch.", "Using switch with strings or doubles (not allowed; it needs integers or chars).", "Nesting several ternaries until nobody can read them."],
      },
      questions: [
        predict(prog('int a = 3, b = 9;\ncout << (a > b ? a : b);'), ["3", "9", "12", "0"], 1, "a > b is false, so the second value, b, is chosen."),
        predict(prog('int x = 2;\nswitch (x) {\n    case 1: cout << "one"; break;\n    case 2: cout << "two"; break;\n    case 3: cout << "three"; break;\n    default: cout << "many";\n}'), ["one", "two", "three", "many"], 1, "x is 2, so the case 2 branch runs and break leaves the switch."),
        predict(prog('int x = 2;\nswitch (x) {\n    case 1: cout << "one ";\n    case 2: cout << "two ";\n    case 3: cout << "three ";\n    default: cout << "many";\n}'), ["two", "two three many", "two three", "many"], 1, "Without break, execution falls through every case below the match, including default."),
        tf("A switch statement can be used with a string variable in C++.", false, "switch works with integer types and chars (and enums), not std::string."),
        fill("Complete the ternary so it stores the smaller value in m.", prog('int a = 4, b = 7;\nint m = (a < b) ___ a : b;\ncout << m;'), ["?"], "The syntax is condition ? valueIfTrue : valueIfFalse.", ["?", ":", "=>"]),
        match("Match the keyword with its job.", [["case", "A value to match in a switch"], ["break", "Leave the switch"], ["default", "Runs when nothing matches"], ["? :", "Choose one of two values"]], "These four pieces make up most switch and ternary code."),
      ],
    },
  ],
};
