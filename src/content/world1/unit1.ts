import { arrange, bug, fill, match, mc, predict, tf } from "../builders";
import type { UnitSeed } from "../types";

export const unit1: UnitSeed = {
  slug: "getting-started",
  title: "Getting Started",
  description: "Meet C++, write your first program and learn how it becomes something a computer can run.",
  icon: "Rocket",
  lessons: [
    {
      slug: "what-is-programming",
      title: "What is Programming?",
      summary: "Programs are precise instructions. C++ turns them into fast machine code.",
      content: {
        concept: "A program is a list of precise instructions that a computer follows exactly, in order.",
        explanation: [
          "Computers are extremely fast but completely literal: they do exactly what you write, never what you meant.",
          "C++ is a compiled language. You write human-readable source code, and a compiler translates it into machine code the processor can run directly. This is a big reason C++ is fast, which is why it is the favourite language of competitive programmers.",
          "Learning to program is mostly learning to break a problem into small, exact steps.",
        ],
        example: {
          code: "// Steps to make tea, as a program would see them:\n// 1. boil water\n// 2. add tea bag\n// 3. wait 3 minutes\n// 4. remove tea bag",
          output: "(nothing - these are only comments)",
          note: "Order matters. Swapping step 1 and 3 would give a very different result.",
        },
        commonMistakes: [
          "Assuming the computer will 'figure out' what you meant. It will not.",
          "Thinking C++ is interpreted line by line. It is compiled first.",
        ],
      },
      questions: [
        mc("What is a program?", ["A list of precise instructions for a computer", "A kind of computer hardware", "A website", "A random set of words"], 0, "A program is a sequence of exact instructions. The computer executes them literally, in order."),
        tf("A computer will automatically fix your mistakes if it understands what you meant.", false, "Computers are literal. They execute exactly what is written, so you must be precise."),
        mc("What does a compiler do?", ["Translates source code into machine code", "Draws graphics", "Connects to the internet", "Writes the program for you"], 0, "The compiler translates human-readable C++ source code into machine code the CPU can execute."),
        match("Match each term with its meaning.", [["Source code", "The text you write"], ["Compiler", "Translates source into machine code"], ["Executable", "The runnable result"], ["Bug", "A mistake in a program"]], "Source code is compiled into an executable. A bug is any mistake that makes the program misbehave."),
        arrange("Put the steps of making a C++ program run in order.", ["Write the source code", "Compile it", "Run the executable", "Read the output"], "You write source code, compile it, run the executable and then check its output."),
      ],
    },
    {
      slug: "your-first-program",
      title: "Your First Program",
      summary: "Write Hello World and understand every line of main().",
      content: {
        concept: "Every C++ program starts running at a function called main().",
        explanation: [
          "#include <iostream> brings in the input/output tools, including cout.",
          "using namespace std; lets you write cout instead of std::cout.",
          "int main() { ... } is where execution begins. The statements inside the braces run from top to bottom, and each statement ends with a semicolon.",
          "return 0; tells the operating system the program finished successfully.",
        ],
        syntax: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // statements go here\n    return 0;\n}",
        example: {
          code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
          output: "Hello, World!",
          note: "endl ends the line. You can also write '\\n'.",
        },
        commonMistakes: [
          "Forgetting the semicolon at the end of a statement.",
          "Writing Main() or MAIN(). C++ is case-sensitive, so it must be main().",
          "Forgetting #include <iostream>, which makes cout unknown.",
        ],
      },
      questions: [
        mc("Where does a C++ program start running?", ["main()", "The first #include", "return 0;", "The last line"], 0, "Execution always begins at main()."),
        fill("Complete the program so it prints Hello.", '#include <iostream>\nusing namespace std;\n\nint main() {\n    ___ << "Hello";\n    return 0;\n}', ["cout"], "cout is the standard output stream. Combined with << it prints text.", ["cout", "cin", "print"]),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hi" << " " << "there";\n    return 0;\n}', ["Hi there", "Hithere", "Hi, there", "Error"], 0, 'The three pieces are printed one after another: "Hi", then a space, then "there".'),
        bug("This program does not compile. What is wrong?", '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello"\n    return 0;\n}', ["Missing semicolon after the cout statement", "Missing #include <string>", "main must return 1", "cout must be uppercase"], 0, "Every statement ends with a semicolon. The cout line is missing one, so the compiler reports an error."),
        arrange("Arrange the lines to build a valid program.", ["#include <iostream>", "using namespace std;", "int main() {", '    cout << "Hi";', "    return 0;", "}"], "Includes come first, then main() with its statements inside the braces."),
      ],
    },
    {
      slug: "cout-cin-comments",
      title: "cout, cin and Comments",
      summary: "Print output, read input and leave notes for humans.",
      content: {
        concept: "cout prints to the screen, cin reads from the keyboard, and comments are ignored by the compiler.",
        explanation: [
          "cout << value prints a value. You can chain several with <<.",
          "cin >> variable reads a value typed by the user into a variable.",
          "// starts a comment that lasts until the end of the line. /* ... */ comments can span many lines.",
          "In competitive programming the judge feeds your program input through cin and reads what you print with cout.",
        ],
        syntax: "int a;\ncin >> a;      // read\ncout << a << \"\\n\";  // print",
        example: {
          code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;   // read two numbers\n    cout << a + b << "\\n";\n    return 0;\n}',
          output: "For the input 3 4 the program prints 7",
          note: "cin skips spaces and newlines between values automatically.",
        },
        commonMistakes: [
          "Using << with cin. It must be cin >> x.",
          "Using >> with cout. It must be cout << x.",
          "Forgetting that text in quotes is printed exactly as written.",
        ],
      },
      questions: [
        mc("Which statement reads an integer into x?", ["cin >> x;", "cin << x;", "cout >> x;", "read(x);"], 0, "cin uses the extraction operator >>. The arrows point from cin into the variable."),
        mc("Which symbol starts a single-line comment?", ["//", "##", "--", "<!--"], 0, "// comments out the rest of the line."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    cout << 2 + 3;\n    return 0;\n}', ["5", "2+3", "23", "Error"], 0, "Without quotes, 2 + 3 is evaluated first, so 5 is printed."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    cout << "2 + 3";\n    return 0;\n}', ["2 + 3", "5", "23", "Error"], 0, "Inside quotes it is just text, so it is printed exactly as written."),
        fill("Fill in the operator so the program reads a number.", '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin ___ n;\n    cout << n;\n    return 0;\n}', [">>"], "cin always pairs with >>.", [">>", "<<", "="]),
        tf("The compiler executes the text inside // comments.", false, "Comments are ignored by the compiler. They are notes for humans."),
      ],
    },
  ],
};
