// Last-modified date per URL path, read straight from data/ so astro.config.mjs can put <lastmod> in the sitemap.
// Listings use the newest of their check dates; list pages use their newest member; other pages use the newest data date.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

const day = (v) => (v ? new Date(v).toISOString().slice(0, 10) : undefined);
const newest = (...ds) => ds.filter(Boolean).sort().at(-1);
const files = (dir, ext) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)) : []);
const frontMatter = (src) => parse(src.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '{}');

export function lastmodMap() {
  const map = new Map();

  const tools = files('data/tools', '.yml')
    .map((f) => ({ id: f.slice(0, -4), ...parse(readFileSync(`data/tools/${f}`, 'utf8')) }))
    .filter((t) => t.status === 'published');
  const byCategory = new Map();
  // Link check dates are not content changes, so they do not move lastmod.
  for (const t of tools) {
    const d = newest(day(t.verified_at), day(t.price_checked_at), day(t.features_checked_at), day(t.kdp_fit?.checked_at), ...(t.price_history ?? []).map((h) => day(h.date)));
    map.set(`/t/${t.id}/`, d);
    for (const c of t.categories) byCategory.set(c, newest(byCategory.get(c), d));
  }
  for (const [c, d] of byCategory) map.set(`/c/${c}/`, d);
  const allTools = newest(...byCategory.values());
  map.set('/tools/', allTools);

  const facts = files('data/facts', '.md').map((f) => ({ id: f.slice(0, -3), ...frontMatter(readFileSync(`data/facts/${f}`, 'utf8')) }));
  for (const f of facts.filter((f) => f.status === 'published')) map.set(`/facts/${f.id}/`, day(f.verified_at));
  const allFacts = newest(...facts.map((f) => day(f.verified_at)));
  map.set('/facts/', allFacts);

  const best = files('data/best', '.yml').map((f) => ({ id: f.slice(0, -4), ...parse(readFileSync(`data/best/${f}`, 'utf8')) }));
  for (const b of best.filter((b) => b.status === 'published')) map.set(`/best/${b.id}/`, day(b.verified_at));
  map.set('/best/', newest(...best.map((b) => day(b.verified_at))));

  const cmp = files('data/compare', '.yml').map((f) => ({ id: f.slice(0, -4), ...parse(readFileSync(`data/compare/${f}`, 'utf8')) }));
  for (const c of cmp.filter((c) => c.status === 'published')) map.set(`/compare/${c.id}/`, day(c.verified_at));
  map.set('/compare/', newest(...cmp.map((c) => day(c.verified_at))));

  const terms = files('data/glossary', '.md').map((f) => frontMatter(readFileSync(`data/glossary/${f}`, 'utf8')));
  map.set('/glossary/', newest(...terms.map((t) => day(t.verified_at))));

  const reports = files('data/reports', '.json').map((f) => JSON.parse(readFileSync(`data/reports/${f}`, 'utf8')));
  for (const r of reports) map.set(`/reports/${r.month}/`, day(r.period_end));
  map.set('/reports/', newest(...reports.map((r) => day(r.period_end))));

  const changes = tools.flatMap((t) => (t.price_history ?? []).map((h) => day(h.date)));
  map.set('/changes/', newest(...changes));
  const changelog = existsSync('data/changelog.json') ? JSON.parse(readFileSync('data/changelog.json', 'utf8')) : [];
  map.set('/changelog/', changelog[0]?.date);
  map.set('/free-tools/', allFacts);
  // Stage pages and calculators change with the listings and facts behind them.
  map.set('/stages/', allTools);
  map.set('/', newest(allTools, allFacts, map.get('/reports/'), changelog[0]?.date));
  return map;
}
