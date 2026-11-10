import { earnings, perFullRead, fullReads, pagesToMatchSale, KENP_CAP } from './logic';
import { $, bindForm, copyButtons, notes, int } from '../shared';

const money = (v: number) => (v >= 100 ? `$${Math.round(v).toLocaleString('en-US')}` : `$${v.toFixed(2)}`);

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const k = (name: string) => $(root, `[data-k="${name}"]`);
  const matchBox = $(root, '[data-el="match"]');
  const list = $(root, '[data-el="notes"]');
  const picker = root.querySelector<HTMLSelectElement>('[data-el="rates"]');
  const rateInput = $<HTMLInputElement>(root, '[name="rate"]');
  picker?.addEventListener('change', () => {
    rateInput.value = picker.value;
    rateInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  function run() {
    const f = new FormData(form);
    const pages = Number(f.get('pages')) || 0;
    const rate = Number(f.get('rate')) || 0;
    const kenpc = Number(f.get('kenpc')) || 0;
    const sale = Number(f.get('sale')) || 0;
    const rows: [string, string][] = [];
    if (!rate) {
      k('earn').textContent = '-';
      k('per').textContent = '-';
      rows.push(['issue-warn', 'Enter the KENP rate to see earnings. It is usually a fraction of a cent, such as 0.0045.']);
    } else {
      k('earn').textContent = money(earnings(pages, rate));
      k('per').textContent = money(perFullRead(kenpc, rate));
      if (rate > 0.02) rows.push(['issue-warn', 'That rate is unusually high. The KENP rate is per page, a fraction of a cent.']);
    }
    k('reads').textContent = kenpc ? int(fullReads(pages, kenpc)) : '-';
    matchBox.hidden = !(sale > 0 && rate > 0);
    if (sale > 0 && rate > 0) {
      const need = pagesToMatchSale(sale, rate);
      k('match').textContent = `${int(need)} pages`;
      const cap = Math.min(kenpc || KENP_CAP, KENP_CAP);
      rows.push(need > cap ? ['issue-warn', `A full read pays less than one sale: ${int(cap)} pages earn ${money(cap * rate)}.`] : ['issue-ok', `A reader who gets ${Math.round((need / cap) * 100)}% through the book earns you about what one sale does.`]);
    }
    if (kenpc > KENP_CAP) rows.push(['issue-warn', `Each subscriber pays for at most ${int(KENP_CAP)} KENP of a title, even though this book is ${int(kenpc)}.`]);
    rows.push(['issue-ok', 'Only the first read of each page counts; re-reads do not pay.']);
    notes(list, rows);
  }

  bindForm(root, form, params, run);
  copyButtons(root);
}
