// Rough Amazon.com BSR -> daily unit sales curve, the same one KDPTop uses: units = A x BSR^-exp.
// An order-of-magnitude estimate only. It ignores Kindle+ page reads, seasonality and category differences.
// data/bsr-curve.json is the copy from KDPTop's /api/public/bsr-curve (node scripts/sync-kdptop.mjs);
// the widget also asks KDPTop for the live curve and uses it when it differs.
import curve from '../../../data/bsr-curve.json';

export interface Curve {
  A: { books: number; kindle: number };
  exp: number;
  model?: string;
  synced_at?: string;
}
export const BSR_CURVE: Curve = curve;
export type Store = keyof Curve['A'];

export function dailySales(rank: number, store: Store = 'books', c: Curve = BSR_CURVE): number | null {
  if (!(rank > 0)) return null;
  const v = c.A[store] * rank ** -c.exp;
  return v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
}

/** BSR that the curve maps to a given number of daily sales (inverse of dailySales). */
export function rankFor(daily: number, store: Store = 'books', c: Curve = BSR_CURVE): number {
  return Math.max(1, Math.round((c.A[store] / daily) ** (1 / c.exp)));
}
