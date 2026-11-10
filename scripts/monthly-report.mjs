// Freezes one month's report into data/reports/YYYY-MM.json: a snapshot of KDPTop's public market data
// (CC BY 4.0) plus the listings, price changes and fact checks recorded in this repository that month.
// Usage: node scripts/monthly-report.mjs [YYYY-MM]. Defaults to last month; the current month gives a month-to-date report.
// Needs full git history (new listings are dated by their first commit) and network access to kdptop.com.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';

const KDPTOP = 'https://kdptop.com/api/public';
const TOP_CATEGORIES = 20;

function lastMonth() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

const month = process.argv[2] ?? lastMonth();
if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error(`month must be YYYY-MM, got ${month}`);
const today = new Date().toISOString().slice(0, 10);
const monthEnd = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).toISOString().slice(0, 10);
if (`${month}-01` > today) throw new Error(`${month} has not started`);
const periodEnd = monthEnd < today ? monthEnd : today;
const inMonth = (d) => d && String(d instanceof Date ? d.toISOString() : d).slice(0, 7) === month;
const iso = (d) => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);

async function json(path) {
  const r = await fetch(`${KDPTOP}/${path}`, { headers: { 'User-Agent': 'kdp123-monthly-report (+https://kdp123.com)' } });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

// Same slug rule as KDPTop's category pages: /kdp/categories/{leaf name}-{node id}/.
function kdptopCategoryUrl(c) {
  const leaf = c.category.split(' > ').pop();
  const slug = leaf.normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  return `https://kdptop.com/kdp/categories/${slug || 'c'}-${c.node_id}/`;
}

const frontmatter = (file) => parse(readFileSync(file, 'utf8').split(/^---$/m)[1]);
const tools = readdirSync('data/tools')
  .filter((f) => f.endsWith('.yml'))
  .map((f) => ({ id: f.slice(0, -4), ...parse(readFileSync(`data/tools/${f}`, 'utf8')) }))
  .filter((t) => t.status === 'published');
const byId = new Map(tools.map((t) => [t.id, t]));

const added = new Map();
const log = execFileSync('git', ['log', '--diff-filter=A', '--name-only', '--format=%x00%cI', '--', 'data/tools'], { encoding: 'utf8' });
for (const block of log.split('\0').filter(Boolean)) {
  const [date, ...files] = block.trim().split('\n');
  for (const f of files) {
    const m = f.match(/^data\/tools\/(.+)\.yml$/);
    if (m) added.set(m[1], date.slice(0, 10));
  }
}

const newListings = [...added]
  .filter(([id, date]) => inMonth(date) && byId.has(id))
  .map(([id, date]) => ({ id, name: byId.get(id).name, categories: byId.get(id).categories, added: date }))
  .sort((a, b) => a.name.localeCompare(b.name));

const priceChanges = tools
  .flatMap((t) =>
    (t.price_history ?? [])
      .filter((h) => inMonth(h.date))
      .map((h) => ({
        id: t.id,
        name: t.name,
        date: iso(h.date),
        kind: h.kind ?? 'price',
        price_now: t.pricing?.from ?? null,
        currency: t.pricing?.currency ?? 'USD',
        note: h.note,
      })),
  )
  .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));

const factsChecked = readdirSync('data/facts')
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ id: f.slice(0, -3), ...frontmatter(`data/facts/${f}`) }))
  .filter((f) => f.status === 'published' && inMonth(f.verified_at))
  .map((f) => ({ id: f.id, title: f.title, verified_at: iso(f.verified_at) }))
  .sort((a, b) => a.title.localeCompare(b.title));

const [facts, meta] = await Promise.all([json('facts'), json('meta')]);

// Adult categories are left out, with the same rule KDPTop uses for its own public pages. A median of 0 reviews on
// a Best Sellers top 100 means review counts were missing for most of the list, which also inflates the score.
const excluded = [];
const topCategories = facts.top_opportunity_categories
  .filter((c) => !/erotic|\bsex/i.test(c.category))
  .filter((c) => {
    if (c.median_reviews !== 0) return true;
    excluded.push({ category: c.category, opportunity_score: c.opportunity_score, reason: 'median reviews reported as 0' });
    return false;
  })
  .slice(0, TOP_CATEGORIES);
// KDPTop does not publish a page for every category it scores; link only the ones that exist.
const categoryUrls = await Promise.all(
  topCategories.map(async (c) => {
    const url = kdptopCategoryUrl(c);
    const r = await fetch(url, { method: 'HEAD', redirect: 'manual' }).catch(() => null);
    return r?.status === 200 ? url : null;
  }),
);

const report = {
  month,
  period_end: periodEnd,
  generated_at: new Date().toISOString(),
  kdptop: {
    source: facts.source,
    license: facts.license,
    url: 'https://kdptop.com/',
    snapshot_at: facts.generated_at,
    data_date: meta.data_date,
    tracked_since: meta.tracked_since,
    marketplace: meta.marketplace,
    coverage: facts.coverage,
    definitions: facts.definitions,
    top_categories: topCategories.map((c, i) => ({
      node_id: c.node_id,
      category: c.category,
      url: categoryUrls[i],
      store: c.store,
      opportunity_score: c.opportunity_score,
      median_price_usd: c.median_price_usd,
      median_reviews: c.median_reviews,
      new_release_share: c.new_release_share,
    })),
    excluded,
  },
  kdp123: {
    listings: tools.length,
    new_listings: newListings,
    price_changes: priceChanges,
    facts_checked: factsChecked,
  },
};

mkdirSync('data/reports', { recursive: true });
writeFileSync(`data/reports/${month}.json`, JSON.stringify(report, null, 2) + '\n');
console.log(
  `data/reports/${month}.json: ${newListings.length} new listings, ${priceChanges.length} price changes, ` +
    `${factsChecked.length} facts checked, ${report.kdptop.top_categories.length} categories (KDPTop data ${meta.data_date})`,
);
