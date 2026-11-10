import { paymentDate, arrivalWindow, daysUntil, upcoming, ARRIVAL, type Channel, type Method } from './logic';
import { $, bindForm, el, notes } from '../shared';

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) => d.toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const month = $<HTMLInputElement>(root, '[name="month"]');
  const k = (name: string) => $(root, `[data-k="${name}"]`);
  const next = $(root, '[data-el="next"]');
  const list = $(root, '[data-el="notes"]');

  // Default to last month's sales (the next payment people usually wait for), set before bindForm reads defaults.
  const now = new Date();
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  month.value = month.defaultValue = last;

  function run() {
    const f = new FormData(form);
    const [y, m] = String(f.get('month') || last).split('-').map(Number);
    const channel = String(f.get('channel')) as Channel;
    const method = String(f.get('method')) as Method;
    if (!y || !m) return;
    const today = new Date();
    const paid = paymentDate(y, m, channel);
    const [a, b] = arrivalWindow(paid, method);
    const days = daysUntil(paid, today);
    k('date').textContent = fmt(paid);
    k('days').textContent = days >= 0 ? String(days) : `paid ${-days} ago`;
    k('arrive').textContent = method === 'check' ? `by ${fmt(b, { month: 'short', day: 'numeric' })}` : `${fmt(a, { month: 'short', day: 'numeric' })} to ${fmt(b, { month: 'short', day: 'numeric' })}`;
    next.replaceChildren(
      ...upcoming(today, channel).map((u) => {
        const li = el('li', { className: 'flex justify-between gap-3 px-3 py-2' });
        const sale = new Date(`${u.sale}-01T00:00:00Z`);
        li.append(el('span', { textContent: `${fmt(sale, { month: 'long', year: 'numeric' })} sales` }), el('span', { className: 'font-medium', textContent: `${fmt(u.paid)} · ${daysUntil(u.paid, today)} days` }));
        return li;
      }),
    );
    const rows: [string, string][] = [['issue-ok', `${ARRIVAL[method].label} after the payment date.`]];
    if (channel === 'expanded') rows.push(['issue-warn', 'Expanded Distribution sales are reported later, so they are paid about 90 days after month end instead of 60.']);
    if (method === 'wire' || method === 'check') rows.push(['issue-warn', 'Wire and check wait until a marketplace balance reaches its threshold, for example $100 on Amazon.com after tax withholding.']);
    rows.push(['issue-ok', 'KDP says "about": the exact day can move a few days, especially around weekends and holidays.']);
    notes(list, rows);
  }

  bindForm(root, form, params, run);
}
