import { bug, fill, match, mc, predict, tf } from "../builders";
import type { UnitSeed } from "../types";

export const unit2: UnitSeed = {
  slug: "variables-data-types",
  title: "Variables and Data Types",
  description: "Store numbers, text and truth values, and learn how C++ decides what fits where.",
  icon: "Box",
  lessons: [
    {
      slug: "variables-and-int",
      title: "Variables and int",
      summary: "Name a value, store it, change it, and know the limits of int.",
      content: {
        concept: "A variable is a named box in memory that holds a value of a specific type.",
        explanation: [
          "You declare a variable by writing its type, then its name: int age = 12;",
          "int stores whole numbers. On almost every modern platform it is 32 bits, so it holds values from -2,147,483,648 to 2,147,483,647 (about 2 billion).",
          "If a result may exceed that range, use long long (64 bits, about 9.2 x 10^18). Competitive programming problems often need it.",
          "A variable can be changed later with assignment: age = 13;",
        ],
        syntax: "int x = 5;\nx = x + 1;   // now 6",
        example: {
          code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int apples = 3;\n    int oranges = 4;\n    int total = apples + oranges;\n    cout << total << "\\n";\n    return 0;\n}',
          output: "7",
          note: "The right side is evaluated first, then stored in the variable on the left.",
        },
        commonMistakes: [
          "Using a variable before declaring it.",
          "Reading an uninitialised variable. Its value is unpredictable, so always give it a starting value.",
          "Letting int overflow. Signed overflow is undefined behaviour in C++.",
        ],
      },
      questions: [
        mc("Which line correctly declares an integer variable named score with the value 10?", ["int score = 10;", "score int = 10;", "int = score 10;", "integer score = 10;"], 0, "The type comes first, then the name, then = value."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    int x = 5;\n    cout << x + 3;\n    return 0;\n}', ["5", "8", "3", "Error"], 1, "x holds 5, so x + 3 is 8."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    int x = 4;\n    x = x * 2;\n    x = x + 1;\n    cout << x;\n    return 0;\n}', ["8", "9", "5", "12"], 1, "x starts at 4, becomes 8, then 9."),
        mc("A problem says the answer can be as large as 5 * 10^12. Which type should you use?", ["long long", "int", "bool", "char"], 0, "int tops out near 2.1 * 10^9. long long holds values up to about 9.2 * 10^18."),
        bug("Why is this code risky?", '#include <iostream>\nusing namespace std;\nint main() {\n    int total;\n    cout << total + 1;\n    return 0;\n}', ["total is never given a value", "cout cannot print numbers", "int cannot be added to 1", "main is missing return"], 0, "Reading an uninitialised local variable gives an unpredictable value. Always initialise: int total = 0;"),
        tf("Two variables in the same scope can share the same name.", false, "Each name in a scope must be unique. Redeclaring the same name is a compile error."),
      ],
    },
    {
      slug: "decimals-chars-bools",
      title: "double, char, bool and string",
      summary: "Decimals, single characters, true/false and text.",
      content: {
        concept: "Different kinds of data need different types: double, char, bool and string.",
        explanation: [
          "double stores numbers with a fractional part, like 3.14. It has about 15 to 16 significant digits of precision, but decimals like 0.1 cannot be stored exactly.",
          "char holds one character in single quotes, like 'A'. Internally it is a small integer (its ASCII code), so 'A' is 65.",
          "bool is either true or false. Printing a bool shows 1 for true and 0 for false.",
          "string (from <string>, included by <iostream> in practice) holds text in double quotes. s.size() gives its length.",
        ],
        syntax: "double pi = 3.14159;\nchar grade = 'A';\nbool ok = true;\nstring name = \"Ada\";",
        example: {
          code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name = "Ada";\n    char grade = \'A\';\n    double score = 9.5;\n    bool passed = true;\n    cout << name << " " << grade << " " << score << " " << passed << "\\n";\n    return 0;\n}',
          output: "Ada A 9.5 1",
          note: "A bool prints as 1 or 0 unless you use boolalpha.",
        },
        commonMistakes: [
          "Using double quotes for a char ('A' is a char, \"A\" is a string).",
          "Comparing doubles with == . Rounding errors make this unreliable.",
          "Forgetting that integer division drops the fraction.",
        ],
      },
      questions: [
        mc("Which literal is a char?", ["'A'", "\"A\"", "A", "(A)"], 0, "Single quotes create a char. Double quotes create a string."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    bool b = true;\n    cout << b;\n    return 0;\n}', ["1", "true", "0", "Error"], 0, "By default a bool prints as 1 (true) or 0 (false)."),
        predict('#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s = "C++";\n    cout << s.size();\n    return 0;\n}', ["3", "2", "4", "C++"], 0, "The string C++ has three characters: C, + and +."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    char c = \'A\';\n    cout << c + 1;\n    return 0;\n}', ["B", "66", "A1", "Error"], 1, "Adding an int to a char produces an int. 'A' is 65, so 65 + 1 = 66. Use (char)(c + 1) to get B."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    double d = 7 / 2;\n    cout << d;\n    return 0;\n}', ["3.5", "3", "4", "Error"], 1, "7 / 2 is integer division and gives 3 before it is stored in the double. Use 7 / 2.0 to get 3.5."),
        match("Match each type with what it stores.", [["int", "Whole numbers"], ["double", "Decimal numbers"], ["char", "One character"], ["bool", "true or false"]], "Pick the type that matches the kind of data you need to store."),
      ],
    },
    {
      slug: "constants-and-conversion",
      title: "Constants and Type Conversion",
      summary: "Protect values with const and convert safely between types.",
      content: {
        concept: "const makes a value read-only, and casts convert one type to another.",
        explanation: [
          "Declare a constant with const: const int MOD = 1000000007; Trying to change it is a compile error, which protects you from accidental bugs.",
          "C++ converts types automatically in many places (implicit conversion), for example int to double when you mix them.",
          "Converting a double to an int truncates toward zero, it does not round: (int)3.99 is 3.",
          "Use an explicit cast when you want control: (double)a / b performs real division.",
        ],
        syntax: "const int N = 100;\ndouble r = (double)a / b;\nint t = (int)3.99;   // 3",
        example: {
          code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 7, b = 2;\n    cout << a / b << "\\n";\n    cout << (double)a / b << "\\n";\n    return 0;\n}',
          output: "3\n3.5",
          note: "Cast one operand and the whole division becomes real division.",
        },
        commonMistakes: [
          "Casting after the division: (double)(a / b) is already 3.",
          "Expecting (int)x to round to the nearest integer.",
          "Trying to modify a const variable.",
        ],
      },
      questions: [
        bug("Why does this fail to compile?", '#include <iostream>\nusing namespace std;\nint main() {\n    const int N = 5;\n    N = 6;\n    cout << N;\n    return 0;\n}', ["A const variable cannot be changed", "N must be lowercase", "const needs a double", "cout cannot print const"], 0, "const values are read-only. Assigning to N is a compile error."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    cout << (int)3.99;\n    return 0;\n}', ["4", "3", "3.99", "Error"], 1, "Casting a double to int truncates toward zero, so 3.99 becomes 3."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    int a = 7, b = 2;\n    cout << (double)a / b;\n    return 0;\n}', ["3", "3.5", "4", "3.0"], 1, "One operand is a double, so the division is real division and gives 3.5."),
        predict('#include <iostream>\nusing namespace std;\nint main() {\n    int a = 7, b = 2;\n    cout << (double)(a / b);\n    return 0;\n}', ["3.5", "3", "4", "Error"], 1, "a / b runs first as integer division (3). Converting 3 to double afterwards gives 3."),
        fill("Make PI a read-only value.", '#include <iostream>\nusing namespace std;\n\nint main() {\n    ___ double PI = 3.14159;\n    cout << PI;\n    return 0;\n}', ["const"], "The const keyword makes a variable read-only.", ["const", "static", "final"]),
        tf("(int)2.9 evaluates to 3 because C++ rounds to the nearest integer.", false, "Converting to int truncates toward zero, so (int)2.9 is 2."),
      ],
    },
  ],
};
