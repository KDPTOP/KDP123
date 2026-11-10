import { checkKeywords, KEYWORD_SLOTS } from '../../lib/calc/listing';
import { $, bindForm, el } from '../shared';

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const out = $(root, '[data-el="out"]');

  function run() {
    const f = new FormData(form);
    const slots = f.getAll('slot').map(String);
    const reports = checkKeywords(slots, String(f.get('title') ?? ''), String(f.get('subtitle') ?? ''), String(f.get('categories') ?? ''), String(f.get('authors') ?? ''));
    const clean = reports.filter((r) => r.issues.length === 0).length;
    const empty = KEYWORD_SLOTS - reports.length;
    const nodes: Node[] = [
      el('p', { className: 'text-sm' }, el('span', { className: 'text-2xl font-semibold tabular-nums' }, `${clean}/${reports.length}`), ` filled slots look clean${empty ? `, ${empty} empty` : ''}.`),
    ];
    for (const r of reports) {
      const box = el('div', { className: r.issues.length ? 'issue-warn' : 'issue-ok' }, el('p', { className: 'font-medium' }, `${r.slot}. ${r.phrase} `, el('span', { className: 'font-normal text-muted' }, `(${r.chars} characters)`)));
      if (r.issues.length) box.append(el('ul', { className: 'mt-1 list-disc pl-5' }, ...r.issues.map((t) => el('li', { textContent: t }))));
      nodes.push(box);
    }
    out.replaceChildren(...nodes);
  }

  bindForm(root, form, params, run);
}
