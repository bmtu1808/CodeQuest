import type { WorldSeed } from "../types";
import { w2unit1 } from "./unit1";
import { w2unit2 } from "./unit2";
import { w2unit3 } from "./unit3";
import { w2unit4 } from "./unit4";
import { w2unit5 } from "./unit5";

export const world2: WorldSeed = {
  slug: "cpp-intermediate",
  title: "C++ Intermediate",
  description: "Arrays, strings, vectors, sorting, binary search, references and pointers.",
  icon: "Layers",
  color: "#1CB0F6",
  published: true,
  units: [w2unit1, w2unit2, w2unit3, w2unit4, w2unit5],
};
