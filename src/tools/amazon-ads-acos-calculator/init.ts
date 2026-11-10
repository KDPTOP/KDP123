import { ads, reportAcos } from './logic';
import { $, bindForm, copyButtons, notes, usd } from '../shared';

const pct = (v: number) => (Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : '-');
const money = (v: number) => (Number.isFinite(v) ? usd(v) : '-');

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const k = (name: string) => $(root, `[data-k="${name}"]`);
  const report = $(root, '[data-el="report"]');
  const roy = $<HTMLAnchorElement>(root, '[data-el="roy"]');
  const list = $(root, '[data-el="notes"]');

  function run() {
    const f = new FormData(form);
    const price = Number(f.get('price')) || 0;
    const royalty = Number(f.get('royalty')) || 0;
    const cpc = Number(f.get('cpc')) || 0;
    const cvr = Number(f.get('cvr')) || 0;
    const spend = Number(f.get('spend')) || 0;
    const sales = Number(f.get('sales')) || 0;
    roy.href = `/free-tools/royalty-calculator/?${new URLSearchParams({ price: String(price || '') })}`;
    const r = ads({ price, royalty, cpc, cvr });
    k('be').textContent = pct(r.breakEvenAcos);
    k('acos').textContent = pct(r.acos);
    k('cps').textContent = money(r.costPerSale);
    k('profit').textContent = money(r.profitPerSale);
    k('maxcpc').textContent = money(r.maxCpc);
    report.hidden = !(spend > 0 && sales > 0);
    if (!report.hidden) k('report').textContent = pct(reportAcos(spend, sales));

    const rows: [string, string][] = [];
    if (royalty >= price && price > 0) rows.push(['issue-error', 'The royalty cannot be higher than the list price. Check both numbers.']);
    else if (Number.isFinite(r.acos)) {
      rows.push(
        r.profitPerSale >= 0
          ? ['issue-ok', `At ${usd(cpc)} a click and ${cvr}% conversion, each ad sale costs ${usd(r.costPerSale)} and leaves ${usd(r.profitPerSale)} of the ${usd(royalty)} royalty.`]
          : ['issue-warn', `Each ad sale costs ${usd(r.costPerSale)}, ${usd(-r.profitPerSale)} more than the royalty. Bid at most ${usd(r.maxCpc)} a click, or raise conversion.`],
      );
    }
    if (!report.hidden) {
      const a = reportAcos(spend, sales);
      rows.push(a <= r.breakEvenAcos ? ['issue-ok', `Your campaign ACoS of ${pct(a)} is under break-even (${pct(r.breakEvenAcos)}).`] : ['issue-warn', `Your campaign ACoS of ${pct(a)} is above break-even (${pct(r.breakEvenAcos)}), before Kindle+ page reads and organic sales the ads may bring.`]);
    }
    rows.push(['issue-ok', 'Ad sales in the console are list price, not royalty, which is why break-even ACoS equals royalty divided by price.']);
    notes(list, rows);
  }

  bindForm(root, form, params, run);
  copyButtons(root);
}
