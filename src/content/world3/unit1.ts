import { arrange, fill, mc, predict, progh, tf } from "../builders";
import type { UnitSeed } from "../types";

export const w3unit1: UnitSeed = {
  slug: "stack-queue",
  title: "Stack, Queue and Deque",
  description: "Containers where order of removal matters: last-in-first-out and first-in-first-out.",
  icon: "Layers3",
  lessons: [
    {
      slug: "stack",
      title: "Stack (LIFO)",
      summary: "push, top and pop: the last item in is the first out.",
      content: {
        concept: "A stack removes the most recently added element first (Last In, First Out).",
        explanation: [
          "Include <stack>. Operations: push(x), top(), pop(), empty(), size(). All run in O(1).",
          "pop() removes the top but does not return it; read it first with top().",
          "Calling top() or pop() on an empty stack is undefined behaviour. Check empty() first.",
          "Classic uses: matching brackets, undo history, evaluating expressions, depth-first search without recursion.",
        ],
        syntax: "stack<int> s;\ns.push(1);\ncout << s.top();\ns.pop();",
        example: { code: progh(["stack"], "stack<int> s;\ns.push(1);\ns.push(2);\ns.push(3);\ns.pop();\ncout << s.top();"), output: "2" },
        commonMistakes: ["Calling top() on an empty stack.", "Expecting pop() to return the value.", "Iterating over a stack (it has no iterators)."],
      },
      questions: [
        predict(progh(["stack"], "stack<int> s;\ns.push(1);\ns.push(2);\ns.push(3);\ns.pop();\ncout << s.top();"), ["2", "3", "1", "Error"], 0, "After pushing 1, 2, 3 and popping the 3, the top is 2."),
        predict(progh(["stack"], "stack<char> s;\nfor (char c : string(\"abc\")) s.push(c);\nwhile (!s.empty()) {\n    cout << s.top();\n    s.pop();\n}"), ["cba", "abc", "bca", "acb"], 0, "LIFO order reverses the sequence."),
        mc("Which structure is ideal for checking balanced brackets?", ["stack", "queue", "set", "map"], 0, "Each closing bracket must match the most recent unmatched opening one, which is exactly LIFO."),
        tf("stack::pop() returns the removed element.", false, "pop() returns void. Use top() before popping."),
        mc("What is the cost of push, pop and top on std::stack?", ["O(1)", "O(n)", "O(log n)", "O(n log n)"], 0, "All three are constant time."),
        arrange("Arrange the lines to print and remove the top of a non-empty stack s.", ["if (!s.empty()) {", "    cout << s.top();", "    s.pop();", "}"], "Check emptiness, read the top, then remove it."),
      ],
    },
    {
      slug: "queue",
      title: "Queue (FIFO)",
      summary: "push, front and pop: first in, first out.",
      content: {
        concept: "A queue serves elements in the order they arrived (First In, First Out).",
        explanation: [
          "Include <queue>. Operations: push(x) adds at the back, front() looks at the oldest element, pop() removes it, back() looks at the newest.",
          "All operations are O(1).",
          "Queues drive breadth-first search (BFS), task scheduling and simulations.",
        ],
        syntax: "queue<int> q;\nq.push(1);\ncout << q.front();\nq.pop();",
        example: { code: progh(["queue"], "queue<int> q;\nq.push(1);\nq.push(2);\nq.push(3);\nq.pop();\ncout << q.front();"), output: "2" },
        commonMistakes: ["Calling front() on an empty queue.", "Mixing up front() and back().", "Using a vector and erasing at the front, which is O(n)."],
      },
      questions: [
        predict(progh(["queue"], "queue<int> q;\nq.push(1);\nq.push(2);\nq.push(3);\nq.pop();\ncout << q.front();"), ["2", "1", "3", "Error"], 0, "pop removes the oldest element (1), so the front becomes 2."),
        predict(progh(["queue"], "queue<int> q;\nq.push(5);\nq.push(6);\ncout << q.back() << q.size();"), ["62", "52", "65", "56"], 0, "back() is the newest element, 6, and the size is 2."),
        mc("Which algorithm uses a queue as its core structure?", ["Breadth-first search", "Binary search", "Quick sort", "Bracket matching"], 0, "BFS visits vertices in the order they were discovered, which is FIFO."),
        tf("In a queue, the element removed first is the one added first.", true, "That is the definition of FIFO."),
        fill("Complete the code to print the oldest element.", progh(["queue"], "queue<int> q;\nq.push(4);\nq.push(9);\ncout << q.___();"), ["front"], "front() reads the element that has waited longest.", ["front", "back", "top"]),
      ],
    },
    {
      slug: "deque",
      title: "Deque and Choosing a Container",
      summary: "Add and remove at both ends.",
      content: {
        concept: "A deque (double-ended queue) supports O(1) push and pop at both ends, plus indexing.",
        explanation: [
          "Include <deque>. push_front, push_back, pop_front, pop_back, front, back and d[i] are all available.",
          "A sliding-window maximum is the classic deque problem.",
          "Choose: stack for LIFO, queue for FIFO, deque when you need both ends, vector when you only grow at the back.",
        ],
        syntax: "deque<int> d;\nd.push_front(1);\nd.push_back(2);",
        example: { code: progh(["deque"], "deque<int> d;\nd.push_back(2);\nd.push_front(1);\nd.push_back(3);\ncout << d.front() << d.back() << d[1];"), output: "132" },
        commonMistakes: ["Using vector::insert at the front inside a loop (O(n) each).", "Calling pop_front on an empty deque."],
      },
      questions: [
        predict(progh(["deque"], "deque<int> d;\nd.push_back(2);\nd.push_front(1);\nd.push_back(3);\ncout << d.front() << d.back() << d[1];"), ["132", "123", "312", "231"], 0, "The deque is {1, 2, 3}: front 1, back 3, d[1] = 2."),
        predict(progh(["deque"], "deque<int> d = {1, 2, 3, 4};\nd.pop_front();\nd.pop_back();\ncout << d.size() << d.front();"), ["22", "21", "32", "23"], 0, "Removing one from each end leaves {2, 3}: size 2, front 2."),
        mc("Which container lets you add and remove at both ends in O(1)?", ["deque", "stack", "queue", "set"], 0, "A deque is designed for both ends."),
        tf("A deque supports random access with d[i].", true, "Unlike stack and queue, deque offers indexing."),
        mc("You need LIFO behaviour only. What is the clearest choice?", ["stack", "deque", "map", "priority_queue"], 0, "std::stack expresses the intent and exposes only the stack operations."),
      ],
    },
  ],
};
