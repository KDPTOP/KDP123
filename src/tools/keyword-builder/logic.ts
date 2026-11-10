// Turn a pile of keyword ideas into KDP's seven keyword slots: clean, dedupe plural and spacing variants,
// drop words Amazon lists as prohibited or wasted (data/facts/keywords-and-categories.md), then fill the slots.

export const SLOTS = 7;

const DROP: [RegExp, string][] = [
  [/\b(best[\s-]?sell(?:ing|er|ers)|#\s?1)\b/, 'sales-rank claims are prohibited'],
  [/\b(free|on sale|discount)\b/, 'promotional words are prohibited'],
  [/\b(kindle unlimited|kindle\+|kdp select|kdp|kindle|amazon|audible)\b/, 'Amazon program and brand names are on the avoid list'],
  [/\b(new|latest|newest)\b/, 'time-sensitive words are on the avoid list'],
  [/^(book|books|ebook|ebooks|novel|novels)$/, 'a generic word on its own is on the avoid list'],
];

export function clean(p: string): string {
  return p
    .toLowerCase()
    .replace(/["“”‘’`]/g, '')
    .replace(/[^\p{L}\p{N}&'\- ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const singular = (w: string) => (w.length > 4 && w.endsWith('ies') ? `${w.slice(0, -3)}y` : w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w);
/** Same phrase up to plurals, spacing and hyphens: "coloring books" = "coloring book" = "coloring-book". */
export const variantKey = (p: string) => clean(p).replace(/-/g, ' ').split(' ').filter(Boolean).map(singular).join(' ');

export function splitIdeas(text: string): string[] {
  return text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
}

export interface Built {
  slots: string[];
  leftovers: string[];
  dropped: [string, string][];
  duplicates: string[];
  /** Phrases that repeat a word from the title or subtitle (Amazon lists metadata words as wasted). */
  inTitle: [string, string[]][];
}

export function build(ideas: string[], opts: { title?: string; subtitle?: string; limit?: number } = {}): Built {
  const seen = new Set<string>();
  const kept: string[] = [];
  const dropped: [string, string][] = [];
  const duplicates: string[] = [];
  for (const raw of ideas) {
    const p = clean(raw);
    if (!p) continue;
    const bad = DROP.find(([re]) => re.test(p));
    if (bad) {
      dropped.push([p, bad[1]]);
      continue;
    }
    const k = variantKey(p);
    if (seen.has(k)) {
      duplicates.push(p);
      continue;
    }
    seen.add(k);
    kept.push(p);
  }

  const titleWords = new Set(variantKey(`${opts.title ?? ''} ${opts.subtitle ?? ''}`).split(' ').filter((w) => w.length > 2));
  const inTitle: [string, string[]][] = [];
  for (const p of kept) {
    const hits = variantKey(p).split(' ').filter((w) => titleWords.has(w));
    if (hits.length) inTitle.push([p, hits]);
  }

  const limit = opts.limit && opts.limit > 0 ? opts.limit : 0;
  const slots: string[] = [];
  const leftovers: string[] = [];
  if (!limit) {
    slots.push(...kept.slice(0, SLOTS));
    leftovers.push(...kept.slice(SLOTS));
  } else {
    // Pack whole phrases into slots up to the character limit, skipping words a slot already has.
    for (const p of kept) {
      if (p.length > limit) {
        leftovers.push(p);
        continue;
      }
      let placed = false;
      for (let i = 0; i < slots.length && !placed; i++) {
        const have = new Set(slots[i].split(' '));
        const add = p.split(' ').filter((w) => !have.has(w));
        const next = add.length ? `${slots[i]} ${add.join(' ')}` : slots[i];
        if (next.length <= limit) {
          slots[i] = next;
          placed = true;
        }
      }
      if (!placed) {
        if (slots.length < SLOTS) slots.push(p);
        else leftovers.push(p);
      }
    }
  }
  return { slots, leftovers, dropped, duplicates, inTitle };
}
