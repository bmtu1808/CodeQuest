import { arrange, bug, fill, match, mc, predict, prog, tf } from "../builders";
import type { UnitSeed } from "../types";

export const unit6: UnitSeed = {
  slug: "functions",
  title: "Functions",
  description: "Package code into reusable pieces, pass data in and out, and meet recursion.",
  icon: "Puzzle",
  lessons: [
    {
      slug: "function-basics",
      title: "Function Basics and Return Values",
      summary: "Define a function once, call it many times.",
      content: {
        concept: "A function is a named block of code that can take inputs (parameters) and give back a result (return value).",
        explanation: [
          "Syntax: returnType name(parameters) { ... }. The function must be declared before the code that calls it.",
          "return sends a value back to the caller and ends the function immediately.",
          "A function that returns nothing has the return type void.",
          "Functions keep programs short, readable and testable. In contests they also stop you from copy-pasting the same code.",
        ],
        syntax: "int square(int x) {\n    return x * x;\n}",
        example: {
          code: prog("cout << square(5);", "int square(int x) {\n    return x * x;\n}"),
          output: "25",
        },
        commonMistakes: ["Calling a function before it is declared.", "Forgetting to return a value from a non-void function.", "Ignoring the returned value."],
      },
      questions: [
        predict(prog("cout << square(5);", "int square(int x) {\n    return x * x;\n}"), ["10", "25", "5", "Error"], 1, "square(5) returns 5 * 5 = 25."),
        predict(prog("cout << add(2, 3) * 2;", "int add(int a, int b) {\n    return a + b;\n}"), ["10", "7", "12", "5"], 0, "add(2, 3) returns 5, and 5 * 2 is 10."),
        mc("Which return type means 'returns nothing'?", ["void", "null", "int", "empty"], 0, "void marks a function that does not return a value."),
        fill("Complete the function so it returns the larger of a and b.", prog("cout << biggest(3, 8);", "int biggest(int a, int b) {\n    if (a > b) return a;\n    ___ b;\n}"), ["return"], "Every path must return a value. If a > b is false we return b.", ["return", "print", "give"]),
        bug("This function should return the sum but the program does not work. What is wrong?", prog("cout << add(1, 2);", "int add(int a, int b) {\n    a + b;\n}"), ["It never returns the sum", "add is a reserved word", "parameters must be double", "main is missing"], 0, "a + b; computes the value and throws it away. Use return a + b;"),
        arrange("Arrange the lines of a function that returns n squared.", ["int sq(int n) {", "    int r = n * n;", "    return r;", "}"], "Declare, compute, return, close the brace."),
      ],
    },
    {
      slug: "parameters-and-references",
      title: "Pass by Value, Pass by Reference and Overloading",
      summary: "Does a function change your variable? It depends on how you pass it.",
      content: {
        concept: "By default a function receives a copy. A reference parameter (&) lets the function change the original.",
        explanation: [
          "Pass by value: void f(int x) works on a copy. Changes do not affect the caller.",
          "Pass by reference: void f(int &x) makes x another name for the caller's variable, so changes are visible outside.",
          "Large objects (strings, vectors) should be passed by const reference, const string &s, to avoid copying them.",
          "Overloading means several functions can share a name if their parameter types differ. The compiler picks the best match.",
        ],
        syntax: "void inc(int &x) { x++; }\nvoid show(int x);\nvoid show(double x);",
        example: {
          code: prog("int a = 5;\ninc(a);\ncout << a;", "void inc(int &x) {\n    x++;\n}"),
          output: "6",
        },
        commonMistakes: ["Expecting a by-value parameter to change the caller's variable.", "Passing big containers by value in a hot loop."],
      },
      questions: [
        predict(prog("int a = 5;\ninc(a);\ncout << a;", "void inc(int x) {\n    x++;\n}"), ["5", "6", "0", "Error"], 0, "x is a copy, so the original a stays 5."),
        predict(prog("int a = 5;\ninc(a);\ncout << a;", "void inc(int &x) {\n    x++;\n}"), ["5", "6", "0", "Error"], 1, "x is a reference to a, so a becomes 6."),
        predict(prog("show(3);\nshow(2.5);", 'void show(int x) {\n    cout << "int ";\n}\nvoid show(double x) {\n    cout << "double ";\n}'), ["int double", "double double", "int int", "Error"], 0, "The compiler picks show(int) for 3 and show(double) for 2.5."),
        mc("Which signature lets the function swap two caller variables?", ["void swapValues(int &a, int &b)", "void swapValues(int a, int b)", "int swapValues(int a, int b)", "void swapValues(const int a, const int b)"], 0, "Only reference parameters can change the caller's variables."),
        tf("Function overloading means two functions with the same name and the same parameter types.", false, "Overloads must differ in their parameter lists, otherwise the call would be ambiguous."),
        match("Match each parameter style with its behaviour.", [["int x", "Gets a copy"], ["int &x", "Can modify the original"], ["const string &s", "Reads without copying"], ["void f()", "Takes no parameters"]], "Choose by value for small types, reference when you need changes, const reference for big read-only data."),
      ],
    },
    {
      slug: "recursion-intro",
      title: "Recursion Introduction",
      summary: "Functions that call themselves.",
      content: {
        concept: "Recursion solves a problem by calling the same function on a smaller version of the problem.",
        explanation: [
          "Every recursive function needs a base case that stops the recursion, and a recursive case that moves toward it.",
          "Example: n! = n * (n-1)!, and 0! = 1. The base case is n == 0.",
          "Each call is stored on the call stack. Too many nested calls (for example a missing base case) causes a stack overflow.",
          "Recursion is the foundation of divide and conquer, backtracking and dynamic programming that you will meet later.",
        ],
        syntax: "int f(int n) {\n    if (n == 0) return 1;   // base case\n    return n * f(n - 1);   // recursive case\n}",
        example: {
          code: prog("cout << fact(5);", "int fact(int n) {\n    if (n == 0) return 1;\n    return n * fact(n - 1);\n}"),
          output: "120",
          note: "5 * 4 * 3 * 2 * 1 = 120.",
        },
        commonMistakes: ["Forgetting the base case.", "A recursive call that does not get closer to the base case."],
      },
      questions: [
        predict(prog("cout << fact(5);", "int fact(int n) {\n    if (n == 0) return 1;\n    return n * fact(n - 1);\n}"), ["24", "120", "5", "720"], 1, "fact(5) = 5 * 4 * 3 * 2 * 1 = 120."),
        predict(prog("countdown(3);", 'void countdown(int n) {\n    if (n == 0) return;\n    cout << n << " ";\n    countdown(n - 1);\n}'), ["3 2 1", "1 2 3", "3 2 1 0", "0 1 2 3"], 0, "It prints n, then recurses with n - 1, and stops at 0."),
        predict(prog("cout << fib(6);", "int fib(int n) {\n    if (n < 2) return n;\n    return fib(n - 1) + fib(n - 2);\n}"), ["6", "8", "13", "5"], 1, "The sequence 0, 1, 1, 2, 3, 5, 8 gives fib(6) = 8."),
        mc("What is a base case?", ["The case where the function stops calling itself", "The first line of main", "A global variable", "A case in a switch"], 0, "The base case returns directly, without another recursive call."),
        tf("A recursive function without a base case will eventually crash with a stack overflow.", true, "Each call uses stack memory. Without a base case the calls never stop."),
      ],
    },
  ],
};
