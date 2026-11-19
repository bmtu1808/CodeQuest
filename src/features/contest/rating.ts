/** Internal contest rating: pairwise Elo over the final ranking. Pure and zero-sum (up to rounding). */

export const START_RATING = 1500;
export const K_FACTOR = 48;
export const MIN_RATING = 100;

export type RatingInput = { userId: string; rating: number; rank: number };
export type RatingOutput = { userId: string; oldRating: number; newRating: number; rank: number };

const expected = (a: number, b: number) => 1 / (1 + 10 ** ((b - a) / 400));

export function computeRatingChanges(players: RatingInput[]): RatingOutput[] {
  const n = players.length;
  if (n < 2) return players.map((p) => ({ userId: p.userId, oldRating: p.rating, newRating: p.rating, rank: p.rank }));
  return players.map((p) => {
    let diff = 0;
    for (const q of players) {
      if (q.userId === p.userId) continue;
      const actual = p.rank < q.rank ? 1 : p.rank === q.rank ? 0.5 : 0;
      diff += actual - expected(p.rating, q.rating);
    }
    const delta = Math.round((K_FACTOR / (n - 1)) * diff * Math.min(n - 1, 4));
    return { userId: p.userId, oldRating: p.rating, newRating: Math.max(MIN_RATING, p.rating + delta), rank: p.rank };
  });
}

/** Titles by rating, for display. */
export function ratingTitle(r: number): string {
  if (r >= 2400) return "Grandmaster";
  if (r >= 2100) return "Master";
  if (r >= 1900) return "Expert";
  if (r >= 1700) return "Specialist";
  if (r >= 1500) return "Pupil";
  return "Newbie";
}
