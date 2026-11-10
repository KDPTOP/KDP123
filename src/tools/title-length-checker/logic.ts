// KDP title and subtitle checks from data/facts/title-and-metadata-guidelines.md.
// Amazon describes the combined limit as "fewer than 200" and "200 characters or less", so 199 is the safe ceiling.

export const TITLE_MAX = 199;
export const SKIM_AT = 60;

export type Level = 'error' | 'warn' | 'ok';
export interface TitleReport {
  titleLength: number;
  subtitleLength: number;
  total: number;
  left: number;
  issues: [Level, string][];
}

const SALES_RANK = /\b(best[\s-]?sell(?:ing|er|ers)|#\s?1\b|number one)/i;
const PROMO = /\b(free|on sale|discount(?:ed)?|cheap|limited time|bonus)\b/i;
const AMAZON_MARKS = /\b(amazon|kindle|kdp|audible|kindle unlimited|kindle\+)\b/i;
const PLACEHOLDER = /^(n\/?a|null|none|untitled|tbd|tba|unknown|test|title)$/i;
const GENERIC = new Set(['notebook', 'notebooks', 'journal', 'journals', 'gift', 'gifts', 'planner', 'planners', 'diary', 'log', 'logbook', 'book', 'books', 'coloring', 'activity']);

export function checkTitle(title: string, subtitle = ''): TitleReport {
  const t = title.trim();
  const s = subtitle.trim();
  const total = t.length + s.length;
  const issues: [Level, string][] = [];
  const both = `${t} ${s}`;

  if (!t) issues.push(['error', 'Enter the title exactly as it appears on the cover.']);
  if (total > TITLE_MAX) issues.push(['error', `Title plus subtitle is ${total} characters. Cut ${total - TITLE_MAX} to get under 200.`]);
  else if (t) issues.push(['ok', `${total} of ${TITLE_MAX} characters used (title plus subtitle).`]);
  if (t.length > SKIM_AT) issues.push(['warn', `The title alone is ${t.length} characters. Amazon notes shoppers tend to skim past titles over ${SKIM_AT}; move detail to the subtitle.`]);
  if (/<[^>]+>/.test(both)) issues.push(['error', 'HTML tags are not allowed in titles or subtitles.']);
  for (const [name, v] of [['title', t], ['subtitle', s]] as const) {
    if (v && PLACEHOLDER.test(v)) issues.push(['error', `"${v}" looks like a placeholder; KDP rejects placeholder ${name}s.`]);
    if (v && /^[\p{P}\p{S}\s]+$/u.test(v)) issues.push(['error', `The ${name} is only punctuation or symbols.`]);
  }
  const rank = both.match(SALES_RANK);
  if (rank) issues.push(['error', `"${rank[0]}" is a sales-rank claim, which KDP does not allow in titles.`]);
  const promo = both.match(PROMO);
  if (promo) issues.push([promo[0].toLowerCase() === 'free' ? 'error' : 'warn', `"${promo[0]}" is promotional wording; KDP prohibits promotional words in titles.`]);
  const mark = both.match(AMAZON_MARKS);
  if (mark) issues.push(['warn', `"${mark[0]}" is an Amazon trademark or program name. Leave it out unless you are authorized to use it.`]);

  const counts = new Map<string, number>();
  for (const w of both.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []) counts.set(w, (counts.get(w) ?? 0) + 1);
  const repeated = [...counts].filter(([w, n]) => GENERIC.has(w) && n >= 2).map(([w]) => w);
  if (repeated.length) issues.push(['warn', `Repeated generic word${repeated.length > 1 ? 's' : ''}: ${repeated.join(', ')}. Amazon treats repeated generic keywords as keyword stuffing.`]);

  return { titleLength: t.length, subtitleLength: s.length, total, left: TITLE_MAX - total, issues };
}
