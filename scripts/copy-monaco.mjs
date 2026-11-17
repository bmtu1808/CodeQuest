// Self-host Monaco (no CDN dependency): copy monaco-editor's minified AMD build into public/monaco/vs.
// public/monaco is git-ignored and recreated on every `npm install`.
import fs from "node:fs";
import path from "node:path";

const src = path.resolve("node_modules/monaco-editor/min/vs");
const dest = path.resolve("public/monaco/vs");
if (!fs.existsSync(src)) {
  console.log("[copy-monaco] monaco-editor not installed, skipping");
  process.exit(0);
}
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log("[copy-monaco] copied Monaco to public/monaco/vs");
