// KDP royalty and printing cost for Amazon.com (USD), from KDP's published rules (same model as KDPTop's calculator).
// Print: (rate x list price) - printing cost; 50% below $9.99, 60% from $9.99; Expanded Distribution 40% (paperback).
// Printing cost = fixed + pages x per-page by binding, ink and trim class, rounded to the cent.
// eBook: 70% of (price - $0.15/MB delivery) for $2.99-$12.99, otherwise 35% of price.

export const RULES_DATE = '2026-10-29';
export const SOURCES = [
  'https://kdp.amazon.com/en_US/help/topic/G201834330',
  'https://kdp.amazon.com/en_US/help/topic/G201834340',
  'https://kdp.amazon.com/help/topic/GHT976ZKSKUXBB6H',
  'https://kdp.amazon.com/help/topic/GPGVYM9KWTYLD2GD',
  'https://kdp.amazon.com/en_US/help/topic/G200634500',
  'https://kdp.amazon.com/en_US/help/topic/G200634560',
];

export type Format = 'paperback' | 'hardcover' | 'ebook';
export type Ink = 'black' | 'standard_color' | 'premium_color';
export type Trim = 'regular' | 'large';

export const PRINT_60_FROM = 9.99;
export const PRINT_RATES = [0.5, 0.6] as const;
export const EXPANDED_RATE = 0.4;
export const EBOOK_70_BAND = [2.99, 12.99] as const;
export const EBOOK_DELIVERY_PER_MB = 0.15;
export const MAX_LIST_PRICE = 250;
/** Large trim: wider than 6.12 in or taller than 9 in. */
export const LARGE_TRIM = [6.12, 9] as const;

interface Tier {
  lo: number;
  hi: number;
  fixed: [number, number]; // regular, large trim
  perPage: [number, number];
}

export const PRINT_COSTS: Record<string, Tier[]> = {
  'paperback:black': [
    { lo: 24, hi: 110, fixed: [2.3, 2.84], perPage: [0, 0] },
    { lo: 112, hi: 828, fixed: [1, 1], perPage: [0.012, 0.017] },
  ],
  'paperback:standard_color': [{ lo: 72, hi: 600, fixed: [1, 1], perPage: [0.0255, 0.0402] }],
  'paperback:premium_color': [
    { lo: 24, hi: 40, fixed: [3.6, 4.2], perPage: [0, 0] },
    { lo: 42, hi: 828, fixed: [1, 1], perPage: [0.065, 0.08] },
  ],
  'hardcover:black': [
    { lo: 75, hi: 108, fixed: [6.8, 7.49], perPage: [0, 0] },
    { lo: 110, hi: 550, fixed: [5.65, 5.65], perPage: [0.012, 0.017] },
  ],
  'hardcover:premium_color': [{ lo: 75, hi: 550, fixed: [5.65, 5.65], perPage: [0.065, 0.08] }],
};

export class RuleError extends Error {}

const cents = (v: number) => Math.round(v * 100 + Number.EPSILON * 100) / 100;

export function trimClass(width: number, height: number): Trim {
  return width > LARGE_TRIM[0] || height > LARGE_TRIM[1] ? 'large' : 'regular';
}

export function printCost(binding: 'paperback' | 'hardcover', ink: Ink, trim: Trim, pages: number): number {
  const tiers = PRINT_COSTS[`${binding}:${ink}`];
  if (!tiers) throw new RuleError(`KDP does not offer ${ink.replace('_', ' ')} ink for ${binding}s.`);
  const large = trim === 'large' ? 1 : 0;
  for (const t of tiers) if (pages >= t.lo && pages <= t.hi) return cents(t.fixed[large] + pages * t.perPage[large]);
  throw new RuleError(`Page count must be between ${tiers[0].lo} and ${tiers[tiers.length - 1].hi} for this binding and ink.`);
}

export const printRate = (price: number) => (price >= PRINT_60_FROM ? PRINT_RATES[1] : PRINT_RATES[0]);

export function ebookRoyalty(price: number, fileMb = 1) {
  if (price >= EBOOK_70_BAND[0] && price <= EBOOK_70_BAND[1]) {
    const delivery = Math.max(0.01, cents(fileMb * EBOOK_DELIVERY_PER_MB));
    return { rate: 0.7, delivery, royalty: cents(0.7 * (price - delivery)) };
  }
  return { rate: 0.35, delivery: 0, royalty: cents(0.35 * price) };
}

export type Note = 'below_min_price' | 'price_cliff' | 'ebook_35';

export interface Result {
  format: Format;
  price: number;
  rate: number;
  royalty: number;
  delivery: number | null;
  printCost: number | null;
  minPrice: number | null;
  expandedRoyalty: number | null;
  /** Royalty at $9.99, shown when a price just under the 60% threshold earns less. */
  cliffRoyalty: number | null;
  notes: Note[];
}

export function calculate(input: { format: Format; price: number; pages?: number; ink?: Ink; trim?: Trim; fileMb?: number }): Result {
  const { format, price } = input;
  if (!(price > 0)) throw new RuleError('Enter a list price.');
  if (price > MAX_LIST_PRICE) throw new RuleError(`KDP list prices cannot exceed $${MAX_LIST_PRICE}.`);
  if (format === 'ebook') {
    const e = ebookRoyalty(price, input.fileMb ?? 1);
    return {
      format, price, rate: e.rate, royalty: e.royalty, delivery: e.delivery, printCost: null, minPrice: null,
      expandedRoyalty: null, cliffRoyalty: null, notes: e.rate < 0.7 ? ['ebook_35'] : [],
    };
  }
  if (!input.pages) throw new RuleError('Enter the page count.');
  const cost = printCost(format, input.ink ?? 'black', input.trim ?? 'regular', Math.round(input.pages));
  const rate = printRate(price);
  const royalty = cents(rate * price - cost);
  // Lowest price KDP accepts: printing cost / rate, using the rate that price would fall in.
  let minPrice = cents(cost / PRINT_RATES[0]);
  if (minPrice >= PRINT_60_FROM) minPrice = Math.max(PRINT_60_FROM, cents(cost / PRINT_RATES[1]));
  const notes: Note[] = [];
  if (price < minPrice) notes.push('below_min_price');
  const atThreshold = cents(PRINT_60_FROM * PRINT_RATES[1] - cost);
  const cliff = rate === PRINT_RATES[0] && atThreshold > royalty;
  if (cliff) notes.push('price_cliff');
  return {
    format, price, rate, royalty, delivery: null, printCost: cost, minPrice,
    expandedRoyalty: format === 'paperback' ? cents(EXPANDED_RATE * price - cost) : null,
    cliffRoyalty: cliff ? atThreshold : null, notes,
  };
}
