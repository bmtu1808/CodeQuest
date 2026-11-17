import { arrange, bug, cpp, fill, match, mc, predict, prog, tf } from "../builders";
import type { UnitSeed } from "../types";

export const unit3: UnitSeed = {
  slug: "operators",
  title: "Operators",
  description: "Calculate, compare and combine conditions, including the all-important modulo.",
  icon: "Calculator",
  lessons: [
    {
      slug: "arithmetic-and-modulo",
      title: "Arithmetic and Modulo",
      summary: "+ - * / and the remainder operator %.",
      content: {
        concept: "Arithmetic operators compute values. % gives the remainder of an integer division.",
        explanation: [
          "C++ has + - * / and %. Multiplication, division and modulo are evaluated before addition and subtraction.",
          "When both operands are integers, / performs integer division and drops the fraction: 7 / 2 is 3.",
          "a % b is the remainder after dividing a by b: 17 % 5 is 2. It is everywhere in competitive programming: checking even/odd (n % 2), wrapping around, and answering 'modulo 10^9+7'.",
          "Dividing or taking modulo by zero is undefined behaviour and usually crashes the program.",
        ],
        syntax: "int q = a / b;   // quotient\nint r = a % b;   // remainder",
        example: {
          code: cpp`#include <iostream>
using namespace std;

int main() {
    int minutes = 135;
    cout << minutes / 60 << " h " << minutes % 60 << " min\n";
    return 0;
}`,
          output: "2 h 15 min",
          note: "Divide for the whole units, modulo for what is left over.",
        },
        commonMistakes: ["Expecting 7 / 2 to be 3.5.", "Dividing by zero.", "Forgetting that % does not work on double (use fmod)."],
      },
      questions: [
        predict(prog("cout << 17 % 5;"), ["3", "2", "3.4", "12"], 1, "17 = 3 * 5 + 2, so the remainder is 2."),
        predict(prog("cout << 7 / 2;"), ["3.5", "3", "4", "2"], 1, "Both operands are ints, so the fractional part is discarded."),
        predict(prog("cout << 10 / 4 * 4;"), ["10", "8", "2", "16"], 1, "Evaluated left to right: 10 / 4 is 2, then 2 * 4 is 8."),
        mc("Which expression is true exactly when n is even?", ["n % 2 == 0", "n / 2 == 0", "n % 2 == 1", "n * 2 == 0"], 0, "An even number leaves remainder 0 when divided by 2."),
        fill("Fill in the operator to get the last digit of n.", prog("int n = 1234;\ncout << n ___ 10;"), ["%"], "Taking a number modulo 10 gives its last digit.", ["%", "/", "*"]),
        predict(prog("cout << -7 % 3;"), ["1", "-1", "2", "-2"], 1, "Since C++11 the result of % has the sign of the left operand. -7 = -2 * 3 + (-1)."),
      ],
    },
    {
      slug: "comparison-and-logic",
      title: "Comparison and Logical Operators",
      summary: "Ask yes/no questions and combine the answers.",
      content: {
        concept: "Comparison operators produce a bool. Logical operators combine bools.",
        explanation: [
          "Comparison: == (equal), != (not equal), < > <= >=. They give true or false.",
          "Logical AND is &&, OR is ||, NOT is !. a && b is true only when both are true. a || b is true when at least one is true.",
          "&& and || short-circuit: if the left side already decides the result, the right side is not evaluated.",
          "Do not confuse == (compare) with = (assign).",
        ],
        syntax: "bool inRange = (x >= 1 && x <= 10);",
        example: {
          code: prog('int age = 15;\ncout << (age >= 13 && age <= 19) << "\\n";'),
          output: "1",
          note: "true prints as 1.",
        },
        commonMistakes: ["Writing x = 5 inside a condition instead of x == 5.", "Writing 1 <= x <= 10 (it does not mean what you think). Use x >= 1 && x <= 10."],
      },
      questions: [
        predict(prog("cout << (5 > 3);"), ["1", "0", "true", "5"], 0, "5 > 3 is true, which prints as 1."),
        predict(prog("cout << (true && false);"), ["0", "1", "true", "false"], 0, "AND needs both sides true."),
        predict(prog("cout << (true || false);"), ["0", "1", "true", "false"], 1, "OR is true when at least one side is true."),
        predict(prog("cout << !true;"), ["1", "0", "true", "Error"], 1, "! flips true to false, which prints as 0."),
        match("Match the operator with its meaning.", [["==", "Equal to"], ["!=", "Not equal to"], ["&&", "Logical AND"], ["||", "Logical OR"]], "Remember: == compares, = assigns."),
        bug("This code always prints 'five'. Why?", prog('int x = 3;\nif (x = 5) cout << "five";\nelse cout << "other";'), ["= assigns 5 to x instead of comparing", "x is not initialised", "if needs braces", "cout needs endl"], 0, "x = 5 assigns the value 5 and the expression is then 5, which is non-zero and counts as true. Use x == 5."),
      ],
    },
    {
      slug: "assignment-and-precedence",
      title: "Assignment and Precedence",
      summary: "Shortcuts like += and ++, and the order operators run in.",
      content: {
        concept: "Compound assignment shortens updates, and precedence decides which operator runs first.",
        explanation: [
          "x += 3 means x = x + 3. The same works for -=, *=, /= and %=.",
          "x++ adds 1 to x. As a standalone statement, x++ and ++x do the same. They differ only inside larger expressions: y = x++ stores the old x in y, then increments x.",
          "Precedence: * / % come before + -. Comparison comes before &&, and && before ||. Parentheses override everything, and are worth using for clarity.",
        ],
        syntax: "x += 3;\nx++;\nint y = (a + b) * c;",
        example: {
          code: prog('int x = 4;\nx += 3;\nx *= 2;\ncout << x << "\\n";'),
          output: "14",
          note: "4 + 3 = 7, then 7 * 2 = 14.",
        },
        commonMistakes: ["Forgetting that * binds tighter than +.", "Mixing x++ inside complex expressions, which is easy to misread."],
      },
      questions: [
        predict(prog("cout << 2 + 3 * 4;"), ["20", "14", "24", "9"], 1, "Multiplication first: 3 * 4 = 12, then 2 + 12 = 14."),
        predict(prog("cout << (2 + 3) * 4;"), ["20", "14", "24", "9"], 0, "Parentheses force the addition first: 5 * 4 = 20."),
        predict(prog("int x = 4;\nx += 3;\nx *= 2;\ncout << x;"), ["14", "10", "11", "7"], 0, "x becomes 7, then 14."),
        predict(prog("int x = 5;\nint y = x++;\ncout << x << \" \" << y;"), ["6 5", "5 6", "6 6", "5 5"], 0, "y receives the old value 5, then x is incremented to 6."),
        tf("x += 5 is equivalent to x = x + 5.", true, "Compound assignment is just a shorthand for the longer form."),
        arrange("Arrange the lines so the program prints 12.", ["int x = 3;", "x *= 2;", "x += 6;", "cout << x;"], "3 * 2 = 6, then 6 + 6 = 12, then print."),
      ],
    },
  ],
};
