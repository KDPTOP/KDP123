import { calculate, RuleError, type Format, type Ink, type Trim } from '../../lib/calc/royalty';
import { $, $$, bindForm, copyButtons, notes, usd } from '../shared';

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const err = $(root, '[data-el="error"]');
  const out = $(root, '[data-el="out"]');
  const list = $(root, '[data-el="notes"]');
  const set = (k: string, v: string) => ($(out, `[data-k="${k}"]`).textContent = v);
  const show = (sel: string, on: boolean) => $$(root, sel).forEach((el) => (el.hidden = !on));

  function run() {
    const f = new FormData(form);
    const format = f.get('format') as Format;
    show('[data-print]', format !== 'ebook');
    show('[data-paperback]', format === 'paperback');
    show('[data-ebook]', format === 'ebook');
    try {
      const r = calculate({
        format,
        price: Number(f.get('price')),
        pages: Number(f.get('pages')),
        ink: f.get('ink') as Ink,
        trim: f.get('trim') as Trim,
        fileMb: Number(f.get('mb')) || 1,
      });
      err.hidden = true;
      out.hidden = false;
      set('royalty', usd(r.royalty));
      set('rate', `${Math.round(r.rate * 100)}%`);
      if (r.printCost !== null) set('cost', usd(r.printCost));
      if (r.minPrice !== null) set('min', usd(r.minPrice));
      if (r.expandedRoyalty !== null) set('expanded', usd(r.expandedRoyalty));
      if (r.delivery !== null) set('delivery', usd(r.delivery));
      const items: [string, string][] = [];
      if (r.notes.includes('below_min_price')) items.push(['issue-error', `KDP will not accept this price: the minimum for this book is ${usd(r.minPrice!)}.`]);
      if (r.notes.includes('price_cliff')) items.push(['issue-warn', `Below $9.99 the rate is 50%. At $9.99 this book would earn ${usd(r.cliffRoyalty!)} per sale.`]);
      if (r.notes.includes('ebook_35')) items.push(['issue-warn', 'Outside $2.99-$12.99 an ebook earns 35%. Price it inside the band to qualify for 70%.']);
      if (r.royalty <= 0 && !r.notes.includes('below_min_price')) items.push(['issue-error', 'This price earns nothing per sale.']);
      if (format === 'paperback' && r.expandedRoyalty !== null && r.expandedRoyalty <= 0)
        items.push(['issue-warn', 'Expanded Distribution pays nothing at this price: 40% of the list price does not cover the printing cost.']);
      notes(list, items);
    } catch (e) {
      if (!(e instanceof RuleError)) throw e;
      err.textContent = e.message;
      err.hidden = false;
      out.hidden = true;
      list.replaceChildren();
    }
  }

  bindForm(root, form, params, run);
  copyButtons(root);
}
