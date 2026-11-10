import { ebookPlan, printPlan, iso, daysBetween } from './logic';
import { $, $$, bindForm, notes } from '../shared';

const fmt = (d: Date) => d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const release = $<HTMLInputElement>(root, '[name="release"]');
  const created = $<HTMLInputElement>(root, '[name="created"]');
  const k = (name: string) => $(root, `[data-k="${name}"]`);
  const heroLabel = $(root, '[data-el="hero-label"]');
  const limitLabel = $(root, '[data-el="limit-label"]');
  const list = $(root, '[data-el="notes"]');

  // Defaults are relative to today, so they are set before bindForm records them.
  const today = iso(new Date());
  release.value = release.defaultValue = iso(new Date(Date.now() + 60 * 86400000));
  created.value = created.defaultValue = today;

  function run() {
    const f = new FormData(form);
    const kind = String(f.get('kind'));
    const rel = String(f.get('release') || release.defaultValue);
    const now = new Date(`${today}T00:00:00Z`);
    for (const e of $$(root, '[data-ebook]')) e.hidden = kind !== 'ebook';
    const rows: [string, string][] = [];
    if (kind === 'ebook') {
      const p = ebookPlan(rel, String(f.get('created') || today));
      heroLabel.textContent = 'Final manuscript due by';
      limitLabel.textContent = 'Latest release you can set';
      k('deadline').textContent = `${fmt(p.fileDeadline)}, 00:00 GMT`;
      const left = daysBetween(now, p.fileDeadline);
      k('left').textContent = left >= 0 ? String(left) : 'passed';
      k('limit').textContent = fmt(p.latestRelease);
      k('postpone').textContent = `${fmt(p.latestPostpone)} (${p.postponements === 2 ? 'up to 2 delays' : '1 delay'})`;
      if (p.tooFar) rows.push(['issue-error', `That release is more than ${p.leadMonths} months after the pre-order was set up. KDP will not accept it.`]);
      if (left < 0) rows.push(['issue-error', 'The 72-hour deadline has passed for this date. Missing it cancels the pre-order and counts toward the penalty.']);
      else if (left <= 7) rows.push(['issue-warn', `Only ${left} days left. After you submit, the book is locked for up to 72 hours while KDP reviews it.`]);
      rows.push(['issue-ok', 'Submit the final file at least 72 hours before release. The first miss is forgiven once per account; a second removes pre-orders for 6 months.']);
    } else {
      const p = printPlan(rel, today);
      heroLabel.textContent = 'Changes locked from';
      limitLabel.textContent = 'Latest release you can schedule';
      k('deadline').textContent = fmt(p.lockFrom);
      const left = daysBetween(now, p.lockFrom);
      k('left').textContent = left >= 0 ? String(left) : 'locked';
      k('limit').textContent = fmt(p.latestRelease);
      if (p.tooFar) rows.push(['issue-error', 'Print releases can be scheduled at most 90 days ahead.']);
      rows.push(['issue-warn', 'KDP has no print pre-orders: the detail page stays hidden until 12:00 AM GMT on release day, so readers cannot order early.']);
      rows.push(['issue-ok', 'From 5 days before release you cannot change the manuscript, details or date, unpublish, or order author copies.']);
    }
    notes(list, rows);
  }

  bindForm(root, form, params, run);
}
