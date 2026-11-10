// The command box behind ⌘K and the home-page "What do you need to work out?" field.
// Calculators match first (with the numbers typed prefilled), then directory tools, then KDP facts and guides.
import { FREE_TOOLS, freeTool } from './freeTools';
import { iconSvg, type IconName } from './icons';
import { intents, describe } from '../tools/intents';
import { openPref } from './pins';

interface IndexTool { id: string; n: string; d: string; p: string; c: string; h: string; r: string; l?: string }
interface IndexPage { n: string; u: string; k: string }
interface Index { tools: IndexTool[]; pages: IndexPage[] }
let index: Promise<Index> | undefined;
export const loadIndex = (): Promise<Index> =>
  (index ??= fetch('/cmdk.json')
    .then((r) => r.json() as Promise<Index>)
    .catch(() => ({ tools: [], pages: [] })));

export type Hit =
  | { kind: 'calc'; slug: string; title: string; sub: string; icon: IconName; params: Record<string, string> }
  | { kind: 'tool'; id: string; title: string; sub: string; logo?: string; site: string; rel: string }
  | { kind: 'page'; title: string; sub: string; href: string }
  | { kind: 'search'; title: string; sub: string; href: string };

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}%$. ]+/gu, ' ').trim();

function score(name: string, extra: string, q: string): number {
  const n = norm(name);
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.split(' ').some((w) => w.startsWith(q))) return 60;
  if (n.includes(q)) return 50;
  const words = q.split(' ').filter((w) => w.length > 1);
  const hay = `${n} ${norm(extra)}`;
  const all = words.length > 0 && words.every((w) => hay.includes(w));
  return all ? 30 + (words.some((w) => n.includes(w)) ? 10 : 0) : 0;
}

export async function search(raw: string): Promise<Hit[]> {
  const q = norm(raw);
  const hits: Hit[] = [];
  const calcs = intents(raw);
  for (const i of calcs) {
    const t = freeTool(i.slug);
    const d = describe(i.params);
    hits.push({ kind: 'calc', slug: t.slug, title: t.name, sub: d ? `Open with ${d}` : t.blurb, icon: t.icon, params: i.params });
  }
  if (!q) {
    for (const t of FREE_TOOLS.slice(0, 6)) hits.push({ kind: 'calc', slug: t.slug, title: t.name, sub: t.blurb, icon: t.icon, params: {} });
    return hits;
  }
  for (const t of FREE_TOOLS) {
    if (hits.some((h) => h.kind === 'calc' && h.slug === t.slug)) continue;
    if (score(t.name, `${t.short} ${t.keywords.join(' ')}`, q) >= 50) hits.push({ kind: 'calc', slug: t.slug, title: t.name, sub: t.blurb, icon: t.icon, params: {} });
  }
  const { tools, pages } = await loadIndex();
  const toolHits = tools
    .map((t) => ({ t, s: score(t.n, `${t.c} ${t.d}`, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 6);
  for (const { t } of toolHits) hits.push({ kind: 'tool', id: t.id, title: t.n, sub: `${t.p} · ${t.c}`, logo: t.l, site: t.h, rel: t.r });
  const pageHits = pages
    .map((p) => ({ p, s: score(p.n, p.k, q) }))
    .filter((x) => x.s >= 30)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4);
  for (const { p } of pageHits) hits.push({ kind: 'page', title: p.n, sub: p.k, href: p.u });
  hits.push({ kind: 'search', title: `Search the site for "${raw.trim()}"`, sub: 'Full-text search of tools, facts and guides', href: `/search/?q=${encodeURIComponent(raw.trim())}` });
  return hits;
}

export const calcHref = (slug: string, params: Record<string, string>) => {
  const qs = new URLSearchParams(params).toString();
  return `/free-tools/${slug}/${qs ? `?${qs}` : ''}`;
};

/** Primary action: calculators open in the home workbench when there is one; tools open their site. */
export function activate(h: Hit, alt = false) {
  if (h.kind === 'calc') {
    const bench = document.querySelector('[data-workbench]');
    if (bench && !alt) {
      window.dispatchEvent(new CustomEvent('workbench-open', { detail: { slug: h.slug, params: h.params } }));
      return true;
    }
    location.href = calcHref(h.slug, h.params);
  } else if (h.kind === 'tool') {
    const details = alt !== (openPref() === 'details');
    if (details) location.href = `/t/${h.id}/`;
    else window.open(h.site, '_blank', h.rel.includes('noopener') ? 'noopener' : undefined);
  } else location.href = h.href;
  return false;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};

function row(h: Hit, active: boolean): HTMLElement {
  const li = el('li', `flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${active ? 'bg-surface-2' : ''}`);
  li.setAttribute('role', 'option');
  li.setAttribute('aria-selected', String(active));
  const lead = el('span', 'flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted');
  if (h.kind === 'calc') {
    lead.className += ' bg-brand-soft text-brand-deep';
    lead.innerHTML = iconSvg(h.icon);
  } else if (h.kind === 'tool' && h.logo) {
    const img = el('img', 'size-6 rounded');
    img.src = h.logo;
    img.alt = '';
    lead.append(img);
  } else lead.innerHTML = iconSvg(h.kind === 'tool' ? 'grid' : h.kind === 'page' ? 'bookOpen' : 'search');
  const mid = el('span', 'min-w-0 flex-1');
  mid.append(el('span', 'block truncate text-sm font-medium text-ink', h.title), el('span', 'block truncate text-xs text-muted', h.sub));
  const tail = el('span', 'hidden shrink-0 items-center gap-1 text-xs text-muted sm:flex');
  if (h.kind === 'tool') {
    const site = openPref() === 'site';
    tail.append(el('span', 'kbd', '↵'), document.createTextNode(site ? ' Open site ' : ' Details '), el('span', 'kbd', 'Tab'), document.createTextNode(site ? ' Details' : ' Open site'));
  } else if (h.kind === 'calc') tail.append(el('span', 'kbd', '↵'), document.createTextNode(document.querySelector('[data-workbench]') ? ' Calculate here' : ' Open'));
  li.append(lead, mid, tail);
  return li;
}

/** Wire an input and a results list. Returns a function that re-runs the search. */
export function mount(input: HTMLInputElement, list: HTMLElement, opts: { onDone?: () => void; emptyShows?: boolean } = {}) {
  let hits: Hit[] = [];
  let at = 0;
  let seq = 0;
  const render = () => {
    list.replaceChildren(...hits.map((h, i) => {
      const li = row(h, i === at);
      li.addEventListener('mousemove', () => {
        if (at !== i) {
          at = i;
          render();
        }
      });
      li.addEventListener('click', (e) => go(h, (e as MouseEvent).metaKey || (e as MouseEvent).ctrlKey));
      return li;
    }));
    list.hidden = hits.length === 0;
    input.setAttribute('aria-expanded', String(hits.length > 0));
  };
  const go = (h: Hit, alt: boolean) => {
    activate(h, alt);
    opts.onDone?.();
  };
  const run = async () => {
    const mine = ++seq;
    const q = input.value;
    if (!q.trim() && !opts.emptyShows) {
      hits = [];
      return render();
    }
    const r = await search(q);
    if (mine !== seq) return;
    hits = r;
    at = 0;
    render();
  };
  input.addEventListener('input', run);
  input.addEventListener('focus', () => loadIndex());
  input.addEventListener('keydown', (e) => {
    if (!hits.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      at = (at + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length;
      render();
      list.children[at]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(hits[at], e.metaKey || e.ctrlKey);
    } else if ((e.key === 'Tab' && !e.shiftKey) || (e.key === 'ArrowRight' && input.selectionStart === input.value.length)) {
      const h = hits[at];
      if (h.kind !== 'tool') return;
      e.preventDefault();
      go(h, true);
    } else if (e.key === 'Escape') {
      hits = [];
      render();
    }
  });
  return run;
}
