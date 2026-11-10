// KDP interior margins from data/facts/bleed-and-margins.md: bleed 0.125 in on top, bottom and outside;
// gutter grows with page count; outside margins at least 0.25 in without bleed, 0.375 in with bleed.

export const BLEED = 0.125;
export const OUTSIDE = { none: 0.25, bleed: 0.375 } as const;
export const GUTTERS: [maxPages: number, inches: number][] = [
  [150, 0.375],
  [300, 0.5],
  [500, 0.625],
  [700, 0.75],
  [828, 0.875],
];
export const MAX_PAGES = 828;
export const MM = 25.4;
/** Millimetres to one decimal, rounded up the way KDP's margin table shows them (0.375 in = 9.6 mm). */
export const mm = (inches: number) => Math.ceil(inches * MM * 10 - 1e-6) / 10;

export function gutterFor(pages: number): number {
  return (GUTTERS.find(([max]) => pages <= max) ?? GUTTERS[GUTTERS.length - 1])[1];
}

export interface Margins {
  pageW: number;
  pageH: number;
  gutter: number;
  outside: number;
  /** Largest text block at the minimum margins, measured on the file's page. */
  textW: number;
  textH: number;
  nextStep?: { at: number; gutter: number };
}

export function margins(trimW: number, trimH: number, pages: number, bleed: boolean): Margins {
  const pageW = trimW + (bleed ? BLEED : 0);
  const pageH = trimH + (bleed ? 2 * BLEED : 0);
  const gutter = gutterFor(pages);
  const outside = bleed ? OUTSIDE.bleed : OUTSIDE.none;
  const i = GUTTERS.findIndex(([max]) => pages <= max);
  const next = i >= 0 && i < GUTTERS.length - 1 ? { at: GUTTERS[i][0] + 1, gutter: GUTTERS[i + 1][1] } : undefined;
  return { pageW, pageH, gutter, outside, textW: pageW - gutter - outside, textH: pageH - 2 * outside, nextStep: next };
}
