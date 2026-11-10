// Helpers shared by every tool widget. A widget is a [data-tool="slug"] element that may appear on its own
// page or inside the tool drawer, so widgets look things up inside their root, never by global id.
import { iconSvg } from '../lib/icons';

export const $ = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => root.querySelector<T>(sel)!;
export const $$ = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => [...root.querySelectorAll<T>(sel)];

export const usd = (v: number) => (v < 0 ? '-$' : '$') + Math.abs(v).toFixed(2);
export const int = (v: number) => Math.round(v).toLocaleString('en-US');

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}

export const notes = (list: HTMLElement, items: [string, string][]) =>
  list.replaceChildren(...items.map(([className, textContent]) => el('li', { className, textContent })));

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const fields = (form: HTMLFormElement) => [...form.elements].filter((e): e is Field => 'name' in e && !!(e as Field).name && !e.hasAttribute('data-nostate'));

/** Set form fields from URL-style params; repeated names (keyword slots) fill in order. */
export function fillForm(form: HTMLFormElement, params: URLSearchParams) {
  const seen = new Map<string, number>();
  for (const f of fields(form)) {
    const all = params.getAll(f.name);
    if (!all.length) continue;
    if (f instanceof HTMLInputElement && (f.type === 'radio' || f.type === 'checkbox')) {
      f.checked = all.includes(f.value);
      continue;
    }
    const i = seen.get(f.name) ?? 0;
    seen.set(f.name, i + 1);
    if (all.length > 1 || fields(form).filter((x) => x.name === f.name).length > 1) {
      if (i < all.length) f.value = all[i];
    } else f.value = all[0];
  }
}

/** Params for the fields that differ from their defaults, so shared links stay short. */
export function formParams(form: HTMLFormElement): URLSearchParams {
  const p = new URLSearchParams();
  const changed = new Set<string>();
  for (const f of fields(form)) {
    if (f instanceof HTMLInputElement && (f.type === 'radio' || f.type === 'checkbox')) {
      if (f.checked !== f.defaultChecked) changed.add(f.name);
    } else if (f instanceof HTMLSelectElement) {
      if ([...f.options].some((o) => o.selected !== o.defaultSelected)) changed.add(f.name);
    } else if (f.value !== f.defaultValue) changed.add(f.name);
  }
  for (const f of fields(form)) {
    if (!changed.has(f.name)) continue;
    if (f instanceof HTMLInputElement && (f.type === 'radio' || f.type === 'checkbox')) {
      if (f.checked) p.append(f.name, f.value);
    } else p.append(f.name, f.value);
  }
  return p;
}

/**
 * Wire a widget's form: prefill from params, run on every change, keep the address bar and the
 * "Open full page" link in step so a result can be shared or carried to the tool page.
 */
export function bindForm(root: HTMLElement, form: HTMLFormElement, params: URLSearchParams, run: () => void) {
  const slug = root.dataset.tool!;
  fillForm(form, params);
  const fulls = $$<HTMLAnchorElement>(root, '[data-full]');
  const updateFull = () => {
    const qs = formParams(form).toString();
    fulls.forEach((a) => (a.href = `/free-tools/${slug}/${qs ? `?${qs}` : ''}`));
  };
  // Writes the address bar: ?a=b on the tool page, ?tool=slug&a=b for the drawer on the home page.
  const sync = () => {
    const p = formParams(form);
    if (location.pathname === `/free-tools/${slug}/`) history.replaceState(null, '', `${location.pathname}${p.size ? `?${p}` : ''}`);
    else if (root.closest('[data-panel]')?.hasAttribute('data-active'))
      history.replaceState(null, '', `${location.pathname}?${new URLSearchParams([['tool', slug], ...p])}`);
  };
  const go = (e?: Event) => {
    run();
    updateFull();
    if (e) sync();
  };
  form.addEventListener('input', go);
  form.addEventListener('change', go);
  form.addEventListener('submit', (e) => e.preventDefault());
  root.addEventListener('tool-sync', sync);
  go();
}

/** Copy buttons on result numbers ([data-k] inside .stat). */
export function copyButtons(root: HTMLElement) {
  for (const dd of $$(root, '.stat dd')) {
    const b = el('button', { type: 'button', className: 'copy-btn', title: 'Copy' });
    b.setAttribute('aria-label', `Copy ${dd.previousElementSibling?.textContent ?? 'value'}`);
    b.innerHTML = iconSvg('copy', 'size-3.5');
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(dd.textContent?.replace(/^~/, '') ?? '');
        b.innerHTML = iconSvg('check', 'size-3.5');
        setTimeout(() => (b.innerHTML = iconSvg('copy', 'size-3.5')), 1500);
      } catch {}
    });
    dd.parentElement!.append(b);
  }
}

export async function copyText(btn: HTMLButtonElement, text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied';
  } catch {
    btn.textContent = 'Press Ctrl+C / Cmd+C';
  }
  setTimeout(() => (btn.textContent = label), 1800);
}
