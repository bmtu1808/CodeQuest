/** Deterministic PRNG (mulberry32) so generated hidden tests are identical on every machine. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** Integer in [lo, hi] (safe for |values| < 2^53). */
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    /** BigInt in [lo, hi]. */
    big: (lo: bigint, hi: bigint) => lo + BigInt(Math.floor(next() * Number(hi - lo + 1n))),
    pick: <T>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)]!,
    shuffle: <T>(xs: T[]) => {
      const a2 = [...xs];
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j]!, a2[i]!];
      }
      return a2;
    },
  };
}
