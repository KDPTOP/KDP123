import { margins, mm, MAX_PAGES } from './logic';
import { parseTrim } from '../../lib/calc/trims';
import { $, bindForm, copyButtons, notes } from '../shared';

const inch = (v: number) => `${+v.toFixed(3)} in`;
const both = (v: number) => `${inch(v)} (${mm(v)} mm)`;

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const k = (name: string) => $(root, `[data-k="${name}"]`);
  const svg = $(root, '[data-el="diagram"]');
  const list = $(root, '[data-el="notes"]');

  function draw(w: number, h: number, g: number, o: number) {
    // Two facing pages, gutter in the middle, scaled to the viewBox.
    const s = Math.min(100 / w, 130 / h);
    const pw = w * s;
    const ph = h * s;
    const y = (150 - ph) / 2;
    const page = (x: number, left: boolean) => {
      const tx = left ? x + o * s : x + g * s;
      const tw = pw - (g + o) * s;
      return `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="var(--surface)" stroke="var(--line)"/><rect x="${tx}" y="${y + o * s}" width="${tw}" height="${ph - 2 * o * s}" fill="var(--brand-soft)" stroke="var(--brand)" stroke-dasharray="3 2"/>`;
    };
    const x0 = 110 - pw;
    svg.innerHTML = `${page(x0, true)}${page(110, false)}<line x1="110" y1="${y}" x2="110" y2="${y + ph}" stroke="var(--muted)"/><text x="110" y="${y - 3}" font-size="7" text-anchor="middle" fill="var(--muted)">spine</text>`;
  }

  function run() {
    const f = new FormData(form);
    const [w, h] = parseTrim(String(f.get('trim'))) ?? [6, 9];
    const pages = Math.min(MAX_PAGES, Math.max(24, Number(f.get('pages')) || 24));
    const bleed = f.get('bleed') === 'yes';
    const m = margins(w, h, pages, bleed);
    k('gutter').textContent = both(m.gutter);
    k('outside').textContent = both(m.outside);
    k('page').textContent = `${+m.pageW.toFixed(3)} x ${+m.pageH.toFixed(3)} in`;
    k('text').textContent = `${+m.textW.toFixed(3)} x ${+m.textH.toFixed(3)} in`;
    draw(w, h, m.gutter, m.outside);
    const rows: [string, string][] = [];
    if (bleed) rows.push(['issue-ok', `With bleed the file page is ${+m.pageW.toFixed(3)} x ${+m.pageH.toFixed(3)} in: 0.125 in added to the width (outside edge only) and 0.25 in to the height. Extend edge images into it.`]);
    if (m.nextStep && m.nextStep.at - pages <= 30) rows.push(['issue-warn', `At ${m.nextStep.at} pages the minimum gutter rises to ${inch(m.nextStep.gutter)}. Leave room if revisions may add pages.`]);
    rows.push(['issue-ok', 'These are KDP minimums. Most novels use 0.75 to 1 in on the outside, top and bottom for comfortable reading.']);
    notes(list, rows);
  }

  bindForm(root, form, params, run);
  copyButtons(root);
}
