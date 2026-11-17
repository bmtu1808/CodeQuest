import type { WorldSeed } from "../types";
import { unit1 } from "./unit1";
import { unit2 } from "./unit2";
import { unit3 } from "./unit3";
import { unit4 } from "./unit4";
import { unit5 } from "./unit5";
import { unit6 } from "./unit6";

export const world1: WorldSeed = {
  slug: "cpp-foundations",
  title: "C++ Foundations",
  description: "Write your first programs and learn variables, operators, decisions, loops and functions.",
  icon: "Rocket",
  color: "#58CC02",
  published: true,
  units: [unit1, unit2, unit3, unit4, unit5, unit6],
};
