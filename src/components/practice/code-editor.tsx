"use client";

import type { editor, Position } from "monaco-editor";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

// Monaco is self-hosted (copied to /public/monaco by scripts/copy-monaco.mjs): no CDN needed.
loader.config({ paths: { vs: "/monaco/vs" } });

const KEYWORDS = ["int", "long long", "double", "char", "bool", "string", "vector", "pair", "map", "set", "unordered_map", "queue", "stack", "priority_queue", "deque", "const", "auto", "struct", "return", "for", "while", "if", "else", "break", "continue", "using namespace std;", "#include <bits/stdc++.h>", "push_back", "pop_back", "emplace_back", "size", "empty", "begin", "end", "sort", "reverse", "lower_bound", "upper_bound", "min", "max", "swap", "accumulate", "cin", "cout", "endl", "ios::sync_with_stdio(false);", "cin.tie(nullptr);", "make_pair", "first", "second"];
const SNIPPETS: Array<{ label: string; body: string; doc: string }> = [
  { label: "fori", body: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}", doc: "for loop" },
  { label: "forr", body: "for (int ${1:i} = ${2:n} - 1; ${1:i} >= 0; ${1:i}--) {\n\t$0\n}", doc: "reverse for loop" },
  { label: "fasti", body: "ios::sync_with_stdio(false);\ncin.tie(nullptr);", doc: "fast input/output" },
  { label: "readv", body: "int ${1:n};\ncin >> ${1:n};\nvector<long long> ${2:a}(${1:n});\nfor (auto &x : ${2:a}) cin >> x;", doc: "read n and a vector" },
  { label: "tcase", body: "int t;\ncin >> t;\nwhile (t--) {\n\t$0\n}", doc: "multiple test cases" },
];

export function CodeEditor({
  value,
  onChange,
  fontSize,
  onRun,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  fontSize: number;
  onRun: () => void;
  onSubmit: () => void;
}) {
  const { resolvedTheme } = useTheme();
  // Keep the latest handlers reachable from Monaco commands registered once.
  const handlers = useRef({ onRun, onSubmit });
  useEffect(() => {
    handlers.current = { onRun, onSubmit };
  });

  const onMount: OnMount = (ed, monaco) => {
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handlers.current.onRun());
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => handlers.current.onSubmit());
    monaco.languages.registerCompletionItemProvider("cpp", {
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const w = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: w.startColumn, endColumn: w.endColumn };
        return {
          suggestions: [
            ...KEYWORDS.map((k) => ({ label: k, kind: monaco.languages.CompletionItemKind.Keyword, insertText: k, range })),
            ...SNIPPETS.map((s) => ({
              label: s.label,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: s.body,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: s.doc,
              range,
            })),
          ],
        };
      },
    });
  };

  return (
    <Editor
      height="100%"
      language="cpp"
      theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={onMount}
      loading={<p className="p-4 text-sm text-muted">Loading editor...</p>}
      options={{
        fontSize,
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        lineNumbers: "on",
        minimap: { enabled: false },
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        autoIndent: "full",
        formatOnType: true,
        scrollBeyondLastLine: false,
        quickSuggestions: { other: true, comments: false, strings: false },
        wordBasedSuggestions: "currentDocument",
        padding: { top: 12 },
        accessibilitySupport: "auto",
      }}
    />
  );
}
