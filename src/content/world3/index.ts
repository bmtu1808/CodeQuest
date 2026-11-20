import type { WorldSeed } from "../types";
import { w3unit1 } from "./unit1";
import { w3unit2 } from "./unit2";
import { w3unit3 } from "./unit3";

export const world3: WorldSeed = {
  slug: "data-structures",
  title: "Data Structures",
  description: "Stack, queue, deque, set, map, priority queue, pairs and complexity estimation.",
  icon: "Database",
  color: "#CE82FF",
  published: true,
  units: [w3unit1, w3unit2, w3unit3],
};
