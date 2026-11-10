// Turns what someone types into the command box into "open this calculator with these fields filled".
// Plain pattern matching in the browser: no AI service and nothing sent anywhere.
import { FREE_TOOLS } from '../lib/freeTools';

export interface Intent {
  slug: string;
  params: Record<string, string>;
  score: number;
}

const num = (s?: string) => (s ? s.replace(/,/g, '') : undefined);

export function extract(q: string) {
  const s = q.toLowerCase();
  const isbn = q.match(/\b(97[89][\d\- ]{9,16}\d|\d{9}[\dXx])\b/)?.[1]?.replace(/[\s-]/g, '');
  const asin = q.match(/\b(B0[A-Z0-9]{8})\b/i)?.[1]?.toUpperCase() ?? q.match(/amazon\.[a-z.]+\/(?:[^\s]*\/)?dp\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase();
  const node = q.match(/amazon\.[a-z.]+\/(?:gp\/)?(?:bestsellers|new-releases|zgbs)\/[a-z-]+\/(\d{3,15})/i)?.[1];
  const price = num(s.match(/\$\s?(\d{1,3}(?:\.\d{1,2})?)/)?.[1] ?? s.match(/(?:^|\s)(\d{1,3}\.\d{2})(?:\s|$)/)?.[1]);
  const pages = num(s.match(/(\d[\d,]{1,6})\s*(?:pages?|pp|kenp)\b/)?.[1]);
  const words = num(s.match(/(\d[\d,]{2,9})\s*(?:k\s*)?words?\b/)?.[1]);
  const wordsK = s.match(/(\d{1,3}(?:\.\d)?)\s*k\s*words?\b/)?.[1];
  const rank = num(s.match(/(?:bsr|rank(?:ed)?|#)\s*#?\s*(\d[\d,]{0,9})/)?.[1]);
  const pct = s.match(/(\d{1,2}(?:\.\d{1,2})?)\s*%/)?.[1];
  const format = /\b(ebook|e-book|kindle)\b/.test(s) ? 'ebook' : /\bhard ?cover\b/.test(s) ? 'hardcover' : /\bpaperback\b/.test(s) ? 'paperback' : undefined;
  const date = q.match(/\b(20\d\d-\d\d-\d\d)\b/)?.[1];
  return { s, isbn, asin, node, price, pages, words: wordsK ? String(Math.round(Number(wordsK) * 1000)) : words, rank, pct, format, date };
}

export function intents(q: string): Intent[] {
  if (q.trim().length < 2) return [];
  const x = extract(q);
  const out: Intent[] = [];
  const add = (slug: string, params: Record<string, string | undefined>, score: number) => {
    const p = Object.fromEntries(Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined));
    const prev = out.find((i) => i.slug === slug);
    if (prev) prev.score = Math.max(prev.score, score);
    else out.push({ slug, params: p, score });
  };

  if (x.isbn && (x.isbn.length === 13 || x.isbn.length === 10)) add('isbn-validator', { isbn: x.isbn }, 100);
  if (x.asin) add('category-finder', { mode: 'resolve', q: x.asin }, 95);
  if (x.node) add('category-finder', { mode: 'node', node: x.node }, 95);

  const paramsFor: Record<string, Record<string, string | undefined>> = {
    'royalty-calculator': { format: x.format, price: x.price, pages: x.pages },
    'ebook-price-checker': { price: x.price },
    'cover-size-calculator': { pages: x.pages },
    'bsr-sales-estimator': { rank: x.rank, store: x.format === 'ebook' ? 'kindle' : undefined },
    'kenp-calculator': { pages: x.pages },
    'amazon-ads-acos-calculator': { price: x.price },
    'word-count-to-page-count': { words: x.words },
    'interior-margin-calculator': { pages: x.pages },
    'preorder-deadline-calculator': { release: x.date },
  };

  // "200 pages" is a number with a unit, not a request for a pages tool.
  const words = x.s.replace(/\$?\d[\d,.]*\s*(?:k\s*)?(?:pages?|pp|kenp|words?)?\b/g, ' ');
  for (const t of FREE_TOOLS) {
    const hits = t.keywords.filter((k) => words.includes(k)).length + (words.includes(t.short.toLowerCase()) ? 2 : 0);
    if (hits) add(t.slug, paramsFor[t.slug] ?? {}, 40 + hits * 10);
  }
  for (const [slug, p] of Object.entries(paramsFor)) {
    const n = Object.entries(p).filter(([k, v]) => k !== 'format' && v !== undefined).length;
    if (n >= 2) add(slug, p, 45 + n * 10);
  }

  // Numbers alone still say a lot.
  if (x.words) add('word-count-to-page-count', paramsFor['word-count-to-page-count'], 55);
  if (x.rank) add('bsr-sales-estimator', paramsFor['bsr-sales-estimator'], 55);
  if (x.price && !out.length) add('royalty-calculator', paramsFor['royalty-calculator'], 35);
  if (x.pages && !out.length) add('cover-size-calculator', paramsFor['cover-size-calculator'], 30);

  const known = new Set(FREE_TOOLS.map((t) => t.slug));
  return out.filter((i) => known.has(i.slug)).sort((a, b) => b.score - a.score).slice(0, 4);
}

/** Short text for what the prefill will be, e.g. "$12.99, 200 pages". */
export function describe(params: Record<string, string>): string {
  const bits: string[] = [];
  if (params.format) bits.push(params.format === 'ebook' ? 'Kindle ebook' : params.format);
  if (params.price) bits.push(`$${params.price}`);
  if (params.pages) bits.push(`${Number(params.pages).toLocaleString('en-US')} pages`);
  if (params.words) bits.push(`${Number(params.words).toLocaleString('en-US')} words`);
  if (params.rank) bits.push(`BSR ${Number(params.rank).toLocaleString('en-US')}`);
  if (params.isbn) bits.push(`ISBN ${params.isbn}`);
  if (params.q) bits.push(params.q);
  if (params.node) bits.push(`category ${params.node}`);
  if (params.release) bits.push(`release ${params.release}`);
  return bits.join(', ');
}
