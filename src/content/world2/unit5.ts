import { bug, fill, mc, predict, prog, tf } from "../builders";
import type { UnitSeed } from "../types";

export const w2unit5: UnitSeed = {
  slug: "references-pointers",
  title: "References and Pointers",
  description: "Aliases, addresses and how functions change the caller's data.",
  icon: "Link",
  lessons: [
    {
      slug: "references",
      title: "References",
      summary: "A reference is another name for an existing variable.",
      content: {
        concept: "int &r = x; makes r an alias for x. Changing r changes x.",
        explanation: [
          "A reference must be bound when it is created and can never be rebound to another variable.",
          "References are the standard way to let a function modify its arguments: void inc(int &x) { x++; }",
          "const T & gives read-only access without copying, ideal for big objects.",
        ],
        syntax: "int x = 5;\nint &r = x;\nr = 9; // x is now 9",
        example: { code: prog("int x = 5;\nint &r = x;\nr = 9;\ncout << x;"), output: "9" },
        commonMistakes: ["Declaring a reference without initialising it.", "Expecting a reference to switch to another variable on assignment."],
      },
      questions: [
        predict(prog("int x = 5;\nint &r = x;\nr = 9;\ncout << x;"), ["9", "5", "14", "Error"], 0, "r is another name for x, so assigning r changes x."),
        predict(prog("int a = 1, b = 2;\nswapIt(a, b);\ncout << a << b;", "void swapIt(int &x, int &y) {\n    int t = x;\n    x = y;\n    y = t;\n}"), ["21", "12", "11", "22"], 0, "References make the function swap the caller's variables."),
        predict(prog("int a = 1, b = 2;\nswapIt(a, b);\ncout << a << b;", "void swapIt(int x, int y) {\n    int t = x;\n    x = y;\n    y = t;\n}"), ["12", "21", "11", "22"], 0, "Without &, the function swaps copies and the caller sees no change."),
        tf("A reference can be re-bound to a different variable after creation.", false, "A reference is permanently bound to the variable it was initialised with."),
        fill("Complete the parameter so the function increases the caller's variable.", prog("int n = 4;\ninc(n);\ncout << n;", "void inc(int ___ x) {\n    x++;\n}"), ["&"], "The & makes x a reference to the argument.", ["&", "*", "&&"]),
      ],
    },
    {
      slug: "pointers",
      title: "Pointers",
      summary: "Addresses, dereferencing and nullptr.",
      content: {
        concept: "A pointer stores the memory address of another variable.",
        explanation: [
          "&x is the address of x. int *p = &x; makes p point to x.",
          "*p (dereferencing) accesses the value p points to. *p = 3 changes x.",
          "nullptr means 'points to nothing'. Dereferencing it crashes the program.",
          "Array names behave like pointers to the first element: a[i] is the same as *(a + i).",
        ],
        syntax: "int x = 5;\nint *p = &x;\n*p = 7;",
        example: { code: prog("int x = 5;\nint *p = &x;\n*p = 7;\ncout << x;"), output: "7" },
        commonMistakes: ["Dereferencing an uninitialised or null pointer.", "Confusing * in a declaration with * as dereference.", "Returning a pointer to a local variable."],
      },
      questions: [
        predict(prog("int x = 5;\nint *p = &x;\n*p = 7;\ncout << x;"), ["7", "5", "12", "Error"], 0, "*p = 7 writes through the pointer into x."),
        predict(prog("int a[3] = {10, 20, 30};\nint *p = a;\ncout << *(p + 2);"), ["30", "10", "20", "Error"], 0, "p points to a[0]; p + 2 points to a[2] which is 30."),
        predict(prog("int a[3] = {10, 20, 30};\ncout << *a;"), ["10", "30", "20", "Error"], 0, "The array name acts as a pointer to the first element."),
        mc("What does &x give?", ["The address of x", "The value of x", "x squared", "A copy of x"], 0, "The address-of operator returns where x lives in memory."),
        tf("Dereferencing nullptr is safe and returns 0.", false, "It is undefined behaviour and normally crashes the program."),
        bug("This function returns something dangerous. Why?", "int *make() {\n    int x = 5;\n    return &x;\n}", ["x is destroyed when the function ends, leaving a dangling pointer", "Functions cannot return pointers", "x must be double", "& is not allowed in return"], 0, "Local variables vanish at function exit. The returned address is invalid."),
      ],
    },
    {
      slug: "memory-and-auto",
      title: "Memory, auto and Scope",
      summary: "Stack vs heap, auto, and how long variables live.",
      content: {
        concept: "Variables live in a scope; new allocates memory that you must release yourself.",
        explanation: [
          "Local variables live on the stack and are destroyed when their block ends.",
          "new int(5) allocates on the heap and returns a pointer; delete p; releases it. Forgetting delete is a memory leak. In modern C++ and in contests, vectors and std::string do this for you, so you rarely need new.",
          "auto lets the compiler deduce a type: auto x = 3.5; makes x a double.",
          "Large arrays (hundreds of thousands of elements) should be global or vectors, not local arrays, because the stack is small.",
        ],
        syntax: "int *p = new int(5);\ndelete p;\nauto x = 3.5;",
        example: { code: prog("int *p = new int(5);\n*p += 1;\ncout << *p;\ndelete p;"), output: "6" },
        commonMistakes: ["Forgetting delete (memory leak).", "Using memory after delete.", "Declaring int a[1000000]; inside main and crashing with stack overflow."],
      },
      questions: [
        predict(prog("int *p = new int(5);\n*p += 1;\ncout << *p;\ndelete p;"), ["6", "5", "1", "Error"], 0, "The heap integer starts at 5 and is incremented to 6."),
        predict(prog("auto x = 7 / 2;\ncout << x;"), ["3", "3.5", "4", "2"], 0, "7 / 2 is integer division, so auto deduces int and x is 3."),
        predict(prog("int x = 1;\n{\n    int x = 2;\n    cout << x;\n}\ncout << x;"), ["21", "12", "22", "11"], 0, "The inner x shadows the outer one only inside the block."),
        mc("What is the safest way to hold a growing list of numbers in a contest?", ["vector<int>", "new int[] and manual delete", "A local array of size 10^7", "A pointer to a local variable"], 0, "vector manages its own memory automatically."),
        tf("Every new must be matched with a delete (or the memory leaks).", true, "Memory from new stays allocated until released."),
      ],
    },
  ],
};
