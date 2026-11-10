import { ebookPriceCheck } from '../../lib/calc/listing';
import { $, bindForm, notes } from '../shared';

const usd = (v: number) => `$${v.toFixed(2)}`;

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const out = $(root, '[data-el="out"]');
  const roy = $<HTMLAnchorElement>(root, '[data-el="roy"]');

  function run() {
    const f = new FormData(form);
    const price = Number(f.get('price'));
    const mb = Number(f.get('mb')) || 0;
    const print = Number(f.get('print')) || undefined;
    roy.href = `/free-tools/royalty-calculator/?${new URLSearchParams({ format: 'ebook', price: String(price || ''), mb: String(mb || 1) })}`;
    const r = ebookPriceCheck(price, mb, print);
    const rows: [string, string][] = [];
    if (!(price > 0)) rows.push(['issue-error', 'KDP does not allow a free list price. Free days need KDP Select.']);
    else {
      rows.push(
        r.ok35
          ? ['issue-ok', `35% option: OK (allowed ${usd(r.min35)} to ${usd(r.max35)} for a ${mb} MB file).`]
          : ['issue-error', `35% option: not allowed. For a ${mb} MB file the price must be ${usd(r.min35)} to ${usd(r.max35)}.`],
      );
      if (r.ok70) rows.push(['issue-ok', `70% option: OK (allowed ${usd(r.min70)} to ${usd(r.max70)}${print ? `, capped by the ${usd(print)} print edition` : ''}).`]);
      else if (r.max70 < r.min70) rows.push(['issue-error', `70% option: not possible. The print edition at ${usd(print!)} would need the ebook below ${usd(r.min70)}.`]);
      else rows.push(['issue-warn', `70% option: not allowed. Price it ${usd(r.min70)} to ${usd(r.max70)}${print && r.max70 < 12.99 ? ` (20% below the ${usd(print)} print edition)` : ''}.`]);
    }
    notes(out, rows);
  }

  bindForm(root, form, params, run);
}
