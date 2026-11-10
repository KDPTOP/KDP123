import { $, $$, el, fillForm, formParams } from '../shared';

interface Metrics { date?: string; median_price?: number | null; median_reviews?: number | null; price_p25?: number | null; price_p75?: number | null }
interface Cat {
  node_id: number; store: string; name: string; kdp_path: string; selectable: boolean; product_count?: number | null;
  amazon_url?: string; list?: { best_url?: string; new_url?: string; metrics?: { best?: Metrics | null } } | null;
  twin?: { kdp_path?: string; selectable?: boolean } | null;
}
interface Snapshot {
  node_id: number; store: string; name: string; path?: string | null; kdp_path?: string | null; selectable?: boolean | null;
  product_count?: number | null; median_price?: number | null; median_reviews?: number | null; new_release_ratio?: number | null;
  opportunity_score?: number | null; data_date?: string | null; best_url?: string | null; kdptop_url?: string | null;
}

const KDPTOP = 'https://kdptop.com/tools/kdp-category';
const num = (v?: number | null) => (v == null ? '-' : Math.round(v).toLocaleString('en-US'));
const usd = (v?: number | null) => (v == null ? '-' : `$${v.toFixed(2)}`);
const safeUrl = (u?: string | null) => (u && /^https:\/\/(www\.amazon\.com|kdptop\.com)\//.test(u) ? u : undefined);

function statGrid(rows: [string, string][]) {
  return el('dl', { className: 'mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4' }, ...rows.map(([k, v]) => el('div', {}, el('dt', { className: 'text-xs text-muted' }, k), el('dd', { className: 'font-medium tabular-nums' }, v))));
}

function card(n: Cat, i: number) {
  const m = n.list?.metrics?.best ?? null;
  const li = el('li', { className: 'rounded-xl border border-line bg-white p-4' });
  li.append(
    el('div', { className: 'flex flex-wrap items-baseline justify-between gap-2' },
      el('p', { className: 'font-semibold' }, `${i + 1}. ${n.name}`),
      el('span', { className: n.selectable ? 'badge badge-ok' : 'badge badge-warn' }, n.selectable ? 'Selectable in KDP' : 'Not selectable in KDP')),
    el('p', { className: 'mt-1 break-words font-mono text-xs text-muted' }, n.kdp_path),
    statGrid([
      ['Books in category', num(n.product_count)],
      ['Median price, top 100', usd(m?.median_price)],
      ['Middle half of prices', m?.price_p25 != null && m?.price_p75 != null ? `${usd(m.price_p25)}-${usd(m.price_p75)}` : '-'],
      ['Median reviews, top 100', num(m?.median_reviews)],
    ]),
  );
  if (n.twin?.kdp_path) li.append(el('p', { className: 'mt-2 text-xs text-muted' }, `Other format: ${n.twin.kdp_path}${n.twin.selectable === false ? ' (not selectable)' : ''}`));
  const links = el('p', { className: 'mt-2 flex flex-wrap gap-x-4 text-sm' });
  const best = safeUrl(n.list?.best_url ?? n.amazon_url);
  const fresh = safeUrl(n.list?.new_url);
  if (best) links.append(el('a', { href: best, rel: 'noopener nofollow', target: '_blank', textContent: 'Best sellers on Amazon' }));
  if (fresh) links.append(el('a', { href: fresh, rel: 'noopener nofollow', target: '_blank', textContent: 'New releases' }));
  if (m?.date) links.append(el('span', { className: 'text-muted', textContent: `List data ${m.date}` }));
  li.append(links);
  return li;
}

function snapshotCard(s: Snapshot) {
  const li = el('li', { className: 'rounded-xl border border-line bg-white p-4' });
  li.append(
    el('div', { className: 'flex flex-wrap items-baseline justify-between gap-2' },
      el('p', { className: 'font-semibold' }, s.name),
      s.selectable == null ? '' : el('span', { className: s.selectable ? 'badge badge-ok' : 'badge badge-warn' }, s.selectable ? 'Selectable in KDP' : 'Not selectable in KDP')),
    el('p', { className: 'mt-1 break-words font-mono text-xs text-muted' }, s.kdp_path ?? s.path ?? `Node ${s.node_id}`),
    statGrid([
      ['Books in category', num(s.product_count)],
      ['Median price, top 100', usd(s.median_price)],
      ['Median reviews, top 100', num(s.median_reviews)],
      ['New releases in top 100', s.new_release_ratio == null ? '-' : `${Math.round(s.new_release_ratio * 100)}%`],
    ]),
  );
  const links = el('p', { className: 'mt-2 flex flex-wrap gap-x-4 text-sm' });
  const best = safeUrl(s.best_url);
  const top = safeUrl(s.kdptop_url);
  if (best) links.append(el('a', { href: best, rel: 'noopener nofollow', target: '_blank', textContent: 'Best sellers on Amazon' }));
  if (top) links.append(el('a', { href: top, rel: 'noopener', target: '_blank', textContent: 'Daily history on KDPTop' }));
  if (s.data_date) links.append(el('span', { className: 'text-muted', textContent: `Data ${s.data_date}` }));
  li.append(links);
  return li;
}

/** Amazon browse-node id from a bare number or a Best Sellers / New Releases / search URL. */
export function nodeId(input: string): string | undefined {
  const s = input.trim();
  if (/^\d{3,15}$/.test(s)) return s;
  const m = s.match(/\/(?:bestsellers|new-releases|zgbs|movers-and-shakers)\/[a-z-]+\/(\d{3,15})/i) ?? s.match(/[?&](?:node|rh=n%3A|rh=n:)(\d{3,15})/i);
  return m?.[1];
}

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const status = $(root, '[data-el="status"]');
  const out = $(root, '[data-el="out"]');
  const more = $(root, '[data-el="more"]');
  const fulls = $$<HTMLAnchorElement>(root, '[data-full]');
  const compact = root.dataset.variant === 'compact';
  const mode = () => String(new FormData(form).get('mode')) as 'recommend' | 'resolve' | 'node';

  const showMode = () => {
    $$(root, '[data-mode]').forEach((e) => (e.hidden = e.dataset.mode !== mode()));
    $$(root, '[data-mode-not]').forEach((e) => (e.hidden = e.dataset.modeNot === mode()));
  };
  form.addEventListener('change', showMode);
  form.addEventListener('input', showMode);
  fillForm(form, params);
  showMode();

  async function lookup() {
    const f = new FormData(form);
    const store = String(f.get('store'));
    const btn = form.querySelector('button')!;
    const qs = formParams(form);
    fulls.forEach((a) => (a.href = `/free-tools/category-finder/${qs.size ? `?${qs}` : ''}`));
    if (location.pathname === '/free-tools/category-finder/') history.replaceState(null, '', `${location.pathname}${qs.size ? `?${qs}` : ''}`);
    let req: Request;
    if (mode() === 'recommend') {
      const text = String(f.get('text')).trim();
      if (text.length < 2) return void (status.textContent = 'Write a sentence or two about the book first.');
      req = new Request('/api/kdptop/placement/recommend', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, store, use_ai: false }) });
    } else if (mode() === 'resolve') {
      const q = String(f.get('q')).trim();
      if (!q) return void (status.textContent = 'Paste an ASIN, ISBN or Amazon link first.');
      req = new Request(`/api/kdptop/placement/resolve?${new URLSearchParams({ q, store })}`);
    } else {
      const id = nodeId(String(f.get('node')));
      if (!id) return void (status.textContent = 'Paste a category number or an Amazon Best Sellers link that ends in a number.');
      req = new Request(`/api/kdptop/category/${id}`);
    }
    btn.disabled = true;
    status.textContent = 'Asking KDPTop…';
    out.replaceChildren();
    more.hidden = true;
    try {
      const res = await fetch(req);
      if (res.status === 429) {
        status.replaceChildren('You have used today\'s free lookups. Try again tomorrow, or continue on ', el('a', { href: KDPTOP, rel: 'noopener', textContent: 'KDPTop' }), ' with a free account.');
        return;
      }
      if (res.status === 404 && mode() === 'node') return void (status.textContent = 'KDPTop does not track this category. It may be outside Books and the Kindle Store, or too new.');
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (mode() === 'node') {
        status.textContent = 'Category snapshot from KDPTop\'s latest crawl.';
        out.replaceChildren(snapshotCard(data as Snapshot));
        return;
      }
      const nodes: Cat[] = (mode() === 'recommend' ? data.recommendations : data.nodes) ?? [];
      const title = data.product?.title as string | undefined;
      if (!nodes.length) {
        status.textContent = mode() === 'resolve' && data.kind === 'asin'
          ? 'No category data for this product yet. Try again later or describe the book instead.'
          : 'No matching categories. Try different words: genre, audience, setting or book type.';
        return;
      }
      status.textContent = `${nodes.length} categor${nodes.length === 1 ? 'y' : 'ies'}${title ? ` for "${title}"` : ''}, best match first.`;
      const shown = compact ? nodes.slice(0, 3) : nodes;
      out.replaceChildren(...shown.map(card));
      more.hidden = !(compact && nodes.length > shown.length);
    } catch {
      status.textContent = 'The lookup failed. Please try again in a minute.';
    } finally {
      btn.disabled = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    lookup();
  });
  // A prefilled ASIN or category (from the command box or a shared link) runs straight away.
  if ((params.get('mode') === 'resolve' && params.get('q')) || (params.get('mode') === 'node' && params.get('node'))) lookup();
  root.addEventListener('tool-prefill', () => {
    showMode();
    if (mode() !== 'recommend') lookup();
  });
}
