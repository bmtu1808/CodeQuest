import type { WorldSeed } from "./types";

/**
 * Worlds 2-6 from the product spec. They have no authored lessons yet, so they are stored UNPUBLISHED
 * and shown on the Learning Path as "Coming soon" - never as playable content.
 */
export const ROADMAP: WorldSeed[] = [
  { slug: "cpp-intermediate", title: "C++ Intermediate", description: "Arrays, strings, pointers, vectors, sorting and binary search.", icon: "Layers", color: "#1CB0F6", published: false, units: [] },
  { slug: "data-structures", title: "Data Structures", description: "Stack, queue, set, map, priority queue, DSU and segment trees.", icon: "Database", color: "#CE82FF", published: false, units: [] },
  { slug: "algorithms", title: "Algorithms", description: "Complexity, prefix sums, two pointers, greedy, graphs and shortest paths.", icon: "Network", color: "#FF9600", published: false, units: [] },
  { slug: "dynamic-programming", title: "Dynamic Programming", description: "Memoisation, knapsack, LIS, LCS, tree and bitmask DP.", icon: "Grid3x3", color: "#FF4B4B", published: false, units: [] },
  { slug: "advanced-cp", title: "Advanced Competitive Programming", description: "Number theory, combinatorics, LCA, SCC, MST and string algorithms.", icon: "Trophy", color: "#FFC800", published: false, units: [] },
];
