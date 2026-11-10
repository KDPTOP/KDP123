import { build, splitIdeas, SLOTS } from './logic';
import { $, bindForm, copyText, el, notes } from '../shared';
import { iconSvg } from '../../lib/icons';

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const ideas = $<HTMLTextAreaElement>(root, '[name="ideas"]');
  const slotsEl = $(root, '[data-el="slots"]');
  const list = $(root, '[data-el="notes"]');
  const copyAll = $<HTMLButtonElement>(root, '[data-el="copy-all"]');
  const seed = $<HTMLInputElement>(root, '[name="seed"]');
  const suggestBtn = $<HTMLButtonElement>(root, '[data-el="suggest"]');
  const status = $(root, '[data-el="suggest-status"]');
  const chips = $(root, '[data-el="suggestions"]');
  let current: string[] = [];

  function run() {
    const f = new FormData(form);
    const r = build(splitIdeas(String(f.get('ideas') ?? '')), {
      title: String(f.get('title') ?? ''),
      subtitle: String(f.get('subtitle') ?? ''),
      limit: Number(f.get('limit')) || 0,
    });
    current = r.slots;
    slotsEl.replaceChildren(
      ...Array.from({ length: SLOTS }, (_, i) => {
        const v = r.slots[i] ?? '';
        const li = el('li', { className: 'flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-sm' });
        li.append(el('span', { className: 'w-4 shrink-0 text-xs text-muted', textContent: String(i + 1) }), el('span', { className: `min-w-0 flex-1 break-words ${v ? '' : 'text-muted'}`, textContent: v || 'empty' }), el('span', { className: 'shrink-0 text-xs text-muted tabular-nums', textContent: v ? `${v.length} ch` : '' }));
        if (v) {
          const b = el('button', { type: 'button', className: 'btn-icon size-7', title: 'Copy' });
          b.setAttribute('aria-label', `Copy slot ${i + 1}`);
          b.innerHTML = iconSvg('copy', 'size-3.5');
          b.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(v);
              b.innerHTML = iconSvg('check', 'size-3.5');
              setTimeout(() => (b.innerHTML = iconSvg('copy', 'size-3.5')), 1200);
            } catch {}
          });
          li.append(b);
        }
        return li;
      }),
    );
    const rows: [string, string][] = [];
    if (r.leftovers.length) rows.push(['issue-warn', `Did not fit in 7 slots: ${r.leftovers.join('; ')}.`]);
    for (const [p, why] of r.dropped) rows.push(['issue-error', `Removed "${p}": ${why}.`]);
    if (r.duplicates.length) rows.push(['issue-ok', `Merged as duplicates or plural/spacing variants: ${r.duplicates.join('; ')}.`]);
    for (const [p, words] of r.inTitle) rows.push(['issue-warn', `"${p}" repeats ${words.join(', ')} from your title. Amazon lists words already in your metadata as wasted keywords.`]);
    if (!rows.length && r.slots.length) rows.push(['issue-ok', 'No prohibited words or duplicates found.']);
    notes(list, rows);
  }

  copyAll.addEventListener('click', () => copyText(copyAll, current.join('\n'), 'Copy all'));

  async function suggest() {
    const q = seed.value.trim();
    if (q.length < 2) {
      status.textContent = 'Type at least two letters.';
      return;
    }
    suggestBtn.disabled = true;
    status.textContent = 'Asking KDPTop…';
    try {
      const res = await fetch(`/api/kdptop/keywords/suggest?${new URLSearchParams({ q })}`);
      if (res.status === 429) {
        status.textContent = "You've used today's free suggestions. They reset at midnight UTC.";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { phrases: string[]; left?: number };
      if (!data.phrases.length) {
        status.textContent = 'No related phrases in the library for that seed. Try a broader one.';
        chips.replaceChildren();
        return;
      }
      status.textContent = `${data.phrases.length} phrases from KDPTop. Tap to add.${data.left != null ? ` ${data.left} lookups left today.` : ''}`;
      chips.replaceChildren(
        ...data.phrases.map((p) => {
          const b = el('button', { type: 'button', className: 'chip px-2.5 py-0.5 text-xs', textContent: `+ ${p}` });
          b.addEventListener('click', () => {
            ideas.value = `${ideas.value.trim()}\n${p}`.trim();
            ideas.dispatchEvent(new Event('input', { bubbles: true }));
            b.remove();
          });
          return b;
        }),
      );
    } catch {
      status.textContent = 'The lookup failed. Please try again in a minute.';
    } finally {
      suggestBtn.disabled = false;
    }
  }
  suggestBtn.addEventListener('click', suggest);
  seed.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      suggest();
    }
  });

  bindForm(root, form, params, run);
}
