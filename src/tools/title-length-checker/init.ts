import { checkTitle, TITLE_MAX } from './logic';
import { $, bindForm, copyButtons, notes } from '../shared';

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const k = (name: string) => $(root, `[data-k="${name}"]`);
  const bar = $(root, '[data-el="bar"]');
  const list = $(root, '[data-el="notes"]');

  function run() {
    const f = new FormData(form);
    const r = checkTitle(String(f.get('title') ?? ''), String(f.get('subtitle') ?? ''));
    k('left').textContent = String(r.left);
    k('title').textContent = `${r.titleLength}`;
    k('subtitle').textContent = `${r.subtitleLength}`;
    const pct = Math.min(100, (r.total / TITLE_MAX) * 100);
    bar.style.width = `${pct}%`;
    bar.className = `h-full rounded-full transition-all ${r.left < 0 ? 'bg-bad' : pct > 85 ? 'bg-warn' : 'bg-ok'}`;
    notes(list, r.issues.map(([level, text]) => [`issue-${level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'ok'}`, text]));
  }

  bindForm(root, form, params, run);
  copyButtons(root);
}
