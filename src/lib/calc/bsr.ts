// Rough Amazon.com BSR -> daily unit sales curve, the same one KDPTop uses: units = A x BSR^-0.85.
// An order-of-magnitude estimate only. It ignores Kindle+ page reads, seasonality and category differences.

export const BSR_CURVE = { A: { books: 12000, kindle: 18000 }, exp: 0.85 } as const;
export type Store = keyof typeof BSR_CURVE.A;

export function dailySales(rank: number, store: Store = 'books'): number | null {
  if (!(rank > 0)) return null;
  const v = BSR_CURVE.A[store] * rank ** -BSR_CURVE.exp;
  return v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
}

/** BSR that the curve maps to a given number of daily sales (inverse of dailySales). */
export function rankFor(daily: number, store: Store = 'books'): number {
  return Math.max(1, Math.round((BSR_CURVE.A[store] / daily) ** (1 / BSR_CURVE.exp)));
}
