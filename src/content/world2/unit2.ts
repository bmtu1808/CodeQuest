import { arrange, fill, mc, predict, progh, tf } from "../builders";
import type { UnitSeed } from "../types";

const s = (body: string) => progh(["string"], body);

export const w2unit2: UnitSeed = {
  slug: "strings",
  title: "Strings",
  description: "Work with text using std::string: length, indexing, searching and building.",
  icon: "Type",
  lessons: [
    {
      slug: "string-basics",
      title: "std::string Basics",
      summary: "Create strings, read them and measure them.",
      content: {
        concept: "std::string holds text. It knows its own length and grows as needed.",
        explanation: [
          "Include <string> (or <iostream>, which usually brings it in) and write string s = \"hello\";",
          "s.size() or s.length() gives the number of characters. s[i] is the character at index i, starting at 0.",
          "cin >> s reads one word (it stops at whitespace). getline(cin, s) reads a whole line.",
          "+ joins strings: \"ab\" + \"cd\" style joining works when at least one side is a std::string.",
        ],
        syntax: "string s = \"code\";\ncout << s.size() << s[0];",
        example: { code: s("string t = \"code\";\ncout << t.size() << t[0];"), output: "4c" },
        commonMistakes: ["Mixing up 'c' (a char) and \"c\" (a string).", "Using cin >> s when the input line contains spaces.", "Comparing s.size() - 1 with an int when s is empty (unsigned wrap-around)."],
      },
      questions: [
        predict(s("string t = \"code\";\ncout << t.size() << t[0];"), ["4c", "3c", "4o", "code"], 0, "The length is 4 and index 0 is the character c."),
        predict(s("string a = \"ab\";\nstring b = \"cd\";\ncout << a + b;"), ["abcd", "ab cd", "cdab", "Error"], 0, "+ concatenates strings."),
        predict(s("string t = \"hello\";\nt[0] = 'J';\ncout << t;"), ["Jello", "hello", "Jhello", "Error"], 0, "Strings are mutable: assigning to t[0] replaces the first character."),
        mc("Which call reads an entire line including spaces?", ["getline(cin, s);", "cin >> s;", "cin.get(s);", "read(s);"], 0, "cin >> s stops at whitespace; getline reads until the newline."),
        tf("In C++, 'a' and \"a\" are the same type.", false, "'a' is a char; \"a\" is a string literal (a character array with a terminator)."),
        fill("Complete the code so it prints the length of s.", s("string s = \"abc\";\ncout << s.___();"), ["size", "length"], "Both size() and length() return the number of characters.", ["size", "length", "count"]),
      ],
    },
    {
      slug: "string-traversal",
      title: "Walking Through Strings",
      summary: "Characters are numbers: count, convert and compare.",
      content: {
        concept: "A char is a small integer. That makes character arithmetic and counting easy.",
        explanation: [
          "'a' < 'b' < ... < 'z', and the letters are consecutive. So c - 'a' is the position of c in the alphabet (0 for 'a').",
          "A frequency array int cnt[26] counts letters: cnt[c - 'a']++.",
          "A range-based loop visits each character: for (char c : s).",
          "Digits work the same way: c - '0' turns '7' into the number 7.",
        ],
        syntax: "int cnt[26] = {};\nfor (char c : s) cnt[c - 'a']++;",
        example: { code: s("string t = \"banana\";\nint cnt[26] = {};\nfor (char c : t) cnt[c - 'a']++;\ncout << cnt['a' - 'a'] << cnt['n' - 'a'];"), output: "32", note: "banana has three a's and two n's." },
        commonMistakes: ["Forgetting that uppercase letters have different codes than lowercase.", "Indexing cnt[c] directly instead of cnt[c - 'a'].", "Treating '7' as 7 instead of 55 (its character code)."],
      },
      questions: [
        predict(s("char c = 'd';\ncout << c - 'a';"), ["3", "d", "100", "4"], 0, "'d' is the fourth letter; subtracting 'a' gives its 0-based position, 3."),
        predict(s("string t = \"banana\";\nint cnt[26] = {};\nfor (char c : t) cnt[c - 'a']++;\ncout << cnt['a' - 'a'] << cnt['n' - 'a'];"), ["32", "23", "33", "62"], 0, "banana contains three a's and two n's."),
        predict(s("char c = '7';\ncout << c - '0' + 1;"), ["8", "55", "71", "7"], 0, "'7' - '0' is the number 7, plus 1 is 8."),
        predict(s("string t = \"abc\";\nfor (int i = t.size() - 1; i >= 0; i--) cout << t[i];"), ["cba", "abc", "bca", "Error"], 0, "The loop walks from the last index down to 0, printing the string reversed."),
        mc("What is the frequency-array index for the letter 'z' using c - 'a'?", ["25", "26", "122", "0"], 0, "'z' is the 26th letter, so its 0-based index is 25."),
        arrange("Arrange the lines to count how many 'e' are in s.", ["int c = 0;", "for (char ch : s) {", "    if (ch == 'e') c++;", "}"], "Initialise the counter, loop over characters, test and increment."),
      ],
    },
    {
      slug: "string-functions",
      title: "Useful String Functions",
      summary: "substr, find, comparison and appending.",
      content: {
        concept: "std::string ships with the operations you need most often.",
        explanation: [
          "s.substr(pos, len) returns a copy of len characters starting at pos.",
          "s.find(t) returns the first index where t occurs, or string::npos if it is absent.",
          "s += t or s.push_back(c) appends. s.empty() tells whether it is empty.",
          "Strings compare with ==, < and >, using dictionary (lexicographic) order.",
        ],
        syntax: "s.substr(1, 3);\ns.find(\"ab\") != string::npos;\ns += \"!\";",
        example: { code: s("string t = \"competitive\";\ncout << t.substr(3, 4) << \" \" << t.find(\"pet\");"), output: "pet 3" },
        commonMistakes: ["Forgetting that substr's second argument is a length, not an end index.", "Comparing find()'s result with -1 on some compilers; use string::npos.", "Assuming \"apple\" < \"Banana\" (uppercase letters sort before lowercase)."],
      },
      questions: [
        predict(s("string t = \"competitive\";\ncout << t.substr(3, 4);"), ["peti", "pet", "mpet", "titi"], 0, "Start at index 3 ('p') and take 4 characters: p, e, t, i."),
        predict(s("string t = \"competitive\";\ncout << t.find(\"pet\");"), ["3", "2", "4", "-1"], 0, "\"pet\" first appears at index 3."),
        predict(s("string a = \"apple\", b = \"banana\";\ncout << (a < b);"), ["1", "0", "apple", "banana"], 0, "Dictionary order: 'a' comes before 'b', so the comparison is true, printed as 1."),
        predict(s("string t = \"go\";\nt += \"!\";\nt.push_back('?');\ncout << t;"), ["go!?", "go", "go?!", "Error"], 0, "+= appends a string and push_back appends a single character."),
        mc("What does s.find(\"x\") return when x does not occur in s?", ["string::npos", "-1 always as int", "0", "An exception"], 0, "It returns the special constant string::npos."),
        tf("s.substr(2, 3) returns the characters at indices 2, 3 and 4.", true, "It starts at index 2 and takes 3 characters."),
      ],
    },
  ],
};
