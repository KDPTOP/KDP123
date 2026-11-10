// Checks the built site (dist/) for the SEO rules in src/lib/seo.ts. Exits 1 on any error.
//   npm run build && npm run check
import { existsSync, readFileSync, globSync } from 'node:fs';
import { dirname, relative } from 'node:path';

const DIST = 'dist';
const ORIGIN = 'https://kdp123.com';
const TITLE_MAX = 60;
const DESC_MIN = 110;
const DESC_MAX = 160;

const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, attr, name) => {
  const m = html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`));
  return m ? unescape(m[1]) : undefined;
};
const toFile = (url) => {
  const p = new URL(url).pathname;
  return `${DIST}${p}${p.endsWith('/') ? 'index.html' : ''}`;
};

if (!existsSync(DIST)) {
  console.error('dist/ not found; run npm run build first');
  process.exit(1);
}

const titles = new Map();
const descs = new Map();
const indexable = new Set();
const noindex = new Set();

for (const file of globSync(`${DIST}/**/index.html`)) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(DIST, dirname(file)).replace(/\\/g, '/');
  const page = `/${rel ? rel + '/' : ''}`;
  const robots = meta(html, 'name', 'robots') ?? '';
  const isNoindex = robots.includes('noindex');
  (isNoindex ? noindex : indexable).add(`${ORIGIN}${page}`);

  const title = unescape(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  if (!title) err(page, 'missing <title>');
  else if (title.length > TITLE_MAX) err(page, `title is ${title.length} chars: ${title}`);
  const desc = meta(html, 'name', 'description');
  if (!desc) err(page, 'missing meta description');

  if (!isNoindex) {
    if (title) titles.set(title, [...(titles.get(title) ?? []), page]);
    if (desc) {
      descs.set(desc, [...(descs.get(desc) ?? []), page]);
      if (desc.length > DESC_MAX) err(page, `description is ${desc.length} chars`);
      else if (desc.length < DESC_MIN) warn(page, `description is ${desc.length} chars`);
    }
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!canonical) err(page, 'missing canonical');
    else if (canonical !== `${ORIGIN}${page}`) warn(page, `canonical points elsewhere: ${canonical}`);
    const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
    if (h1s !== 1) err(page, `${h1s} <h1> elements`);
  }

  const og = meta(html, 'property', 'og:image');
  if (!og) err(page, 'missing og:image');
  else if (og.startsWith(ORIGIN) && !existsSync(`${DIST}${new URL(og).pathname}`)) err(page, `og:image file missing: ${og}`);
  if (!meta(html, 'property', 'og:title')) err(page, 'missing og:title');
  if (!meta(html, 'name', 'twitter:card')) err(page, 'missing twitter:card');

  let crumbs = 0;
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const node of [data].flat()) if (node['@type'] === 'BreadcrumbList') crumbs++;
    } catch (e) {
      err(page, `JSON-LD does not parse: ${e.message}`);
    }
  }
  if (crumbs > 1) err(page, `${crumbs} BreadcrumbList blocks`);

  for (const img of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(img[0])) err(page, `<img> without alt: ${img[0].slice(0, 80)}`);
    else if (!/\swidth=/.test(img[0]) || !/\sheight=/.test(img[0])) warn(page, `<img> without width/height: ${img[0].slice(0, 80)}`);
  }
}

for (const [t, pages] of titles) if (pages.length > 1) err(pages.join(', '), `duplicate title: ${t}`);
for (const [d, pages] of descs) if (pages.length > 1) err(pages.join(', '), `duplicate description: ${d.slice(0, 60)}…`);

const sitemapFiles = globSync(`${DIST}/sitemap-*.xml`).filter((f) => !f.endsWith('sitemap-index.xml'));
const inSitemap = new Set();
for (const f of sitemapFiles) {
  for (const m of readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) inSitemap.add(m[1]);
}
if (inSitemap.size === 0) err('sitemap', 'no URLs found');
for (const url of inSitemap) {
  if (!existsSync(toFile(url))) err('sitemap', `URL has no built page: ${url}`);
  if (noindex.has(url)) err('sitemap', `noindex page listed: ${url}`);
}
for (const url of indexable) if (!inSitemap.has(url)) warn('sitemap', `indexable page not listed: ${url}`);

for (const feed of ['rss.xml', 'changes/rss.xml', 'reports/rss.xml']) {
  const f = `${DIST}/${feed}`;
  if (!existsSync(f)) {
    err(feed, 'missing');
    continue;
  }
  const xml = readFileSync(f, 'utf8');
  if (!/<rss[\s>]/.test(xml) || !/<channel>/.test(xml)) err(feed, 'not an RSS document');
  const guids = [...xml.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map((m) => m[1]);
  const dupes = guids.filter((g, i) => guids.indexOf(g) !== i);
  if (dupes.length) err(feed, `duplicate guid: ${[...new Set(dupes)].join(', ')}`);
  const opens = xml.match(/<item>/g)?.length ?? 0;
  const closes = xml.match(/<\/item>/g)?.length ?? 0;
  if (opens !== closes) err(feed, 'unbalanced <item> tags');
}
if (existsSync(`${DIST}/feed.json`)) {
  try {
    JSON.parse(readFileSync(`${DIST}/feed.json`, 'utf8'));
  } catch (e) {
    err('feed.json', `does not parse: ${e.message}`);
  }
} else err('feed.json', 'missing');

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`seo-lint: ${indexable.size} indexable pages, ${noindex.size} noindex, ${inSitemap.size} in sitemap; ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
