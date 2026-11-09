// Listing checks from KDP's help pages (see the matching /facts/ pages). They flag likely problems; KDP's own
// review decides.

// ---- Paperback cover ----

export const BLEED = 0.125;
export const SPINE_PER_PAGE = { white: 0.002252, cream: 0.0025, groundwood: 0.00235, premium_color: 0.002347 } as const;
export type Paper = keyof typeof SPINE_PER_PAGE;
export const SPINE_TEXT_MIN_PAGES = 79;
export const SPINE_TEXT_CLEARANCE = 0.0625;

export function paperbackCover(trimW: number, trimH: number, pages: number, paper: Paper) {
  const even = Math.ceil(pages / 2) * 2;
  const spine = even * SPINE_PER_PAGE[paper];
  return {
    pages: even,
    spine,
    width: BLEED + trimW + spine + trimW + BLEED,
    height: BLEED + trimH + BLEED,
    spineText: even >= SPINE_TEXT_MIN_PAGES,
    spineTextWidth: Math.max(0, spine - 2 * SPINE_TEXT_CLEARANCE),
  };
}

export const MM = 25.4;
export const px300 = (inches: number) => Math.ceil(inches * 300);

// ---- Ebook list price (Amazon.com) ----

export const EBOOK_35 = { max: 200, minBySize: [[10, 2.99], [3, 1.99], [0, 0.99]] as [number, number][] };
export const EBOOK_70 = { min: 2.99, max: 12.99, belowPrint: 0.2 };

export function ebookPriceCheck(price: number, fileMb: number, printPrice?: number) {
  const min35 = EBOOK_35.minBySize.find(([mb]) => fileMb >= mb)![1];
  const max70 = printPrice ? Math.min(EBOOK_70.max, Math.floor(printPrice * (1 - EBOOK_70.belowPrint) * 100) / 100) : EBOOK_70.max;
  const ok35 = price >= min35 && price <= EBOOK_35.max;
  const ok70 = price >= EBOOK_70.min && price <= max70;
  return { min35, max35: EBOOK_35.max, min70: EBOOK_70.min, max70, ok35, ok70 };
}

// ---- Description ----

export const DESCRIPTION_MAX = 4000;
export const ALLOWED_TAGS = ['br', 'p', 'b', 'em', 'i', 'u', 'h4', 'h5', 'h6', 'ol', 'ul', 'li'];

export interface Issue {
  level: 'error' | 'warn';
  text: string;
}

const PATTERNS: [RegExp, string][] = [
  [/\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(com|net|org|io|co|me|info|shop|store)\b/i, 'Looks like a URL or domain. KDP does not allow website addresses.'],
  [/[\w.+-]+@[\w-]+\.[\w.]+/, 'Looks like an email address. Contact details are not allowed.'],
  [/(\+?\d[\d\s().-]{8,}\d)/, 'Looks like a phone number. Contact details are not allowed.'],
  [/[$£€¥]\s?\d|\b\d+(\.\d\d)?\s?(usd|dollars)\b|\d+\s?% off\b|\b(on sale|discount(ed)?|buy now|order now|available now|in stock|free (download|copy|bonus|gift|shipping)|download (it )?(today|now))\b/i, 'Mentions price, promotions or ordering. KDP does not allow pricing or availability details.'],
  [/\b(limited time|today only|this week|new release|pre-?order|coming soon|tour dates?)\b/i, 'Time-sensitive wording. It goes out of date and KDP does not allow it.'],
  [/[★☆]|\b(\d(\.\d)?\s?stars?|five-star|5-star|reviews? (says?|calls?)|must[- ]read|praise for)\b|[“"][^”"]{8,}[”"]\s*[-—–]\s*\w/i, 'Looks like a review, rating or testimonial. Those belong in editorial reviews, not the description.'],
  [/\b(please (leave|write) a review|leave a review|review this book)\b/i, 'Asks for reviews. KDP does not allow review requests in the description.'],
  [/\p{Extended_Pictographic}/u, 'Contains an emoji. KDP does not allow Unicode emojis.'],
  [/[\u200B-\u200F\u2028-\u202F\u2060\uFEFF]/, 'Contains invisible characters (often pasted from a word processor). Retype that part.'],
];

export function checkDescription(html: string): { length: number; text: number; issues: Issue[] } {
  const issues: Issue[] = [];
  const length = [...html].length;
  if (length > DESCRIPTION_MAX) issues.push({ level: 'error', text: `${length.toLocaleString('en-US')} characters, over the 4,000 limit by ${(length - DESCRIPTION_MAX).toLocaleString('en-US')}. Tags count too.` });
  if (/<<|<>|<\s|<(?![a-z/!])/i.test(html)) issues.push({ level: 'error', text: 'Stray angle bracket (such as << or <>). KDP rejects these.' });

  const stack: string[] = [];
  const bad = new Set<string>();
  for (const m of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi)) {
    const [, close, raw, self] = m;
    const tag = raw.toLowerCase();
    if (!ALLOWED_TAGS.includes(tag)) { bad.add(tag); continue; }
    if (tag === 'br' || self) continue;
    if (!close) stack.push(tag);
    else if (stack[stack.length - 1] === tag) stack.pop();
    else if (stack.includes(tag)) { issues.push({ level: 'error', text: `Tags overlap around </${tag}>. Close inner tags first.` }); stack.splice(stack.lastIndexOf(tag), 1); }
    else issues.push({ level: 'error', text: `</${tag}> has no opening tag.` });
  }
  for (const t of bad) issues.push({ level: 'error', text: /^h[1-3]$/.test(t) ? `<${t}> is not supported. Use <h4>, <h5> or <h6>.` : `<${t}> is not a supported tag.` });
  for (const t of new Set(stack)) issues.push({ level: 'error', text: `<${t}> is never closed. The rest of the description may render in that style.` });

  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
  for (const [re, msg] of PATTERNS) if (re.test(text)) issues.push({ level: 'warn', text: msg });
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words > 0 && words < 60) issues.push({ level: 'warn', text: `Only ${words} words. Amazon suggests about a 150-word paragraph.` });
  return { length, text: words, issues };
}

/** Plain text to KDP HTML: blank lines make paragraphs, "- " lines make lists, **bold** and *italic*. */
export function formatDescription(src: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>');
  return src
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim());
      if (lines.every((l) => /^[-*•]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-*•]\s+/, ''))}</li>`).join('')}</ul>`;
      if (lines.every((l) => /^\d+[.)]\s+/.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
      if (lines.length === 1 && /^#{1,6}\s+/.test(lines[0])) return `<h4>${inline(lines[0].replace(/^#{1,6}\s+/, ''))}</h4>`;
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    })
    .join('');
}

// ---- Keywords ----

export const KEYWORD_SLOTS = 7;
const AVOID: [RegExp, string][] = [
  [/["“”']/, 'Remove quotation marks. Quoted phrases only match shoppers who type every word.'],
  [/\b(best|bestselling|best-selling|#1|number one|top rated|top-rated|award[- ]winning)\b/i, 'Quality claims and sales rank are not allowed.'],
  [/\bnew\b(?!\s+(adult|york|zealand|england|orleans|mexico|testament|age))|\b(on sale|available now|limited time|discount|cheap)\b|(?<!(gluten|sugar|dairy|stress|hands|cruelty|fat|carb)[- ])\bfree\b/i, 'Time-sensitive or promotional words are not allowed.'],
  [/\b(kindle\s*\+|kindle plus|kdp select|kindle unlimited|kindle vella|audible)\b/i, 'Amazon program names are not allowed.'],
  [/\b(amazon|kdp)\b(?!\s*select)|\bkindle\b(?!\s*(\+|plus|unlimited|vella))/i, 'Amazon brand names are only allowed where you are authorized to use them.'],
  [/<[^>]+>/, 'HTML is not allowed in keywords.'],
  [/\bbooks?\b|\bebooks?\b|\bnovels?\b/i, 'Words like "book" or "ebook" add nothing: every result is already a book.'],
];

export interface KeywordReport {
  slot: number;
  phrase: string;
  chars: number;
  issues: string[];
}

const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const stem = (w: string) => w.replace(/(ies)$/, 'y').replace(/(es|s)$/, '');

export function checkKeywords(slots: string[], title = '', subtitle = '', categories = '', authors = '') {
  const meta = new Set([...words(title), ...words(subtitle), ...words(categories)].filter((w) => w.length > 2).map(stem));
  const people = authors.split(/[,;\n]/).map((a) => a.trim().toLowerCase()).filter((a) => a.length > 2);
  const seen = new Map<string, number>();
  const reports: KeywordReport[] = [];
  slots.forEach((raw, i) => {
    const phrase = raw.trim();
    if (!phrase) return;
    const issues: string[] = [];
    for (const [re, msg] of AVOID) if (re.test(phrase)) issues.push(msg);
    const ws = words(phrase);
    const dupMeta = [...new Set(ws.filter((w) => meta.has(stem(w))))];
    if (dupMeta.length) issues.push(`Already in your title, subtitle or categories: ${dupMeta.join(', ')}. Amazon indexes those already.`);
    const dupSlot = [...new Set(ws.filter((w) => w.length > 2 && seen.has(stem(w))))];
    if (dupSlot.length) issues.push(`Repeats ${dupSlot.map((w) => `"${w}" (slot ${seen.get(stem(w))})`).join(', ')}. Repeating words or plurals does not add reach.`);
    for (const p of people) if (phrase.toLowerCase().includes(p)) issues.push(`Mentions "${p}". Do not reference other authors or their books.`);
    if (ws.length === 1) issues.push('Single word. Amazon recommends phrases of 2-3 words in natural order.');
    ws.forEach((w) => { if (w.length > 2 && !seen.has(stem(w))) seen.set(stem(w), i + 1); });
    reports.push({ slot: i + 1, phrase, chars: [...phrase].length, issues });
  });
  return reports;
}
