import { estimatePages } from './logic';
import { parseTrim } from '../../lib/calc/trims';
import { $, bindForm, copyButtons, notes, int } from '../shared';

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const k = (name: string) => $(root, `[data-k="${name}"]`);
  const cover = $<HTMLAnchorElement>(root, '[data-el="cover"]');
  const roy = $<HTMLAnchorElement>(root, '[data-el="roy"]');
  const list = $(root, '[data-el="notes"]');

  function run() {
    const f = new FormData(form);
    const words = Number(f.get('words')) || 0;
    const trim = String(f.get('trim'));
    const [w, h] = parseTrim(trim) ?? [6, 9];
    const font = Number(f.get('font')) || 11;
    const chapters = Number(f.get('chapters')) || 0;
    const extra = f.get('extra') === null ? 8 : Number(f.get('extra')) || 0;
    const r = estimatePages(words, w, h, font, chapters, extra);
    k('pages').textContent = int(r.pages);
    k('wpp').textContent = `~${int(r.wordsPerPage)}`;
    k('text').textContent = int(r.textPages);
    cover.href = `/free-tools/cover-size-calculator/?${new URLSearchParams({ preset: trim, pages: String(r.pages) })}`;
    roy.href = `/free-tools/royalty-calculator/?${new URLSearchParams({ pages: String(r.pages), ...(w > 6.12 || h > 9 ? { trim: 'large' } : {}) })}`;
    const rows: [string, string][] = [];
    if (r.pages > 828) rows.push(['issue-error', `${int(r.pages)} pages is over KDP's paperback maximum of 828 (less on cream paper and large trims). Use a larger trim, a smaller font or split the book.`]);
    else if (r.pages > 550) rows.push(['issue-warn', 'Over 550 pages: fine for a paperback, but too long for a KDP hardcover (75 to 550 pages).']);
    if (r.pages >= 79) rows.push(['issue-ok', 'At 79 pages or more, KDP allows text on the spine.']);
    rows.push(['issue-ok', 'An estimate from typical book typesetting. KDP counts pages from your final file, so check the number after formatting.']);
    notes(list, rows);
  }

  bindForm(root, form, params, run);
  copyButtons(root);
}
