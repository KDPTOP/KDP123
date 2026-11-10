// Fetches each tool's site icon into public/logos/<slug>.png (64x64), from the vendor's own site.
// Order: apple-touch-icon, the largest declared PNG/SVG icon, web manifest icons, /apple-touch-icon.png, favicon.ico,
// then Google's favicon cache for the same domain (sites that block scripted requests). Icons under 32px are skipped.
// Tools with no usable icon get a letter tile at render time instead.
//   node scripts/fetch-logos.mjs           only tools without a logo yet
//   node scripts/fetch-logos.mjs --all     refetch everything
//   node scripts/fetch-logos.mjs slug ...  just these tools
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';
import sharp from 'sharp';

const OUT = 'public/logos';
const SIZE = 64;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
// Sites whose only icon is generic or not a logo (a store badge, a screenshot, a photo of a person); they get the letter tile.
const SKIP = new Set(['ds-amazon-quick-view', 'kdp-tools-io', 'low-content-profits']);
const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.filter((a) => !a.startsWith('--'));

mkdirSync(OUT, { recursive: true });

async function get(url, accept = '*/*') {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

function candidates(html, base) {
  const out = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = tag.match(/\brel=["']?([^"'>]+)/i)?.[1].toLowerCase() ?? '';
    const href = tag.match(/\bhref=["']?([^"'\s>]+)/i)?.[1];
    if (!href || !/icon/.test(rel) || /mask-icon/.test(rel)) continue;
    const size = Number(tag.match(/\bsizes=["']?(\d+)x\d+/i)?.[1] ?? 0);
    const url = new URL(href.replace(/&amp;/g, '&'), base).toString();
    const svg = /\.svg(\?|$)/i.test(url) || /image\/svg/i.test(tag);
    const score = (/apple-touch/.test(rel) ? 1000 : 0) + (svg ? 900 : 0) + size;
    out.push({ url, score });
  }
  const manifest = html.match(/<link\b[^>]*rel=["']?manifest[^>]*>/i)?.[0].match(/\bhref=["']?([^"'\s>]+)/i)?.[1];
  return { links: out.sort((a, b) => b.score - a.score).map((c) => c.url), manifest: manifest && new URL(manifest, base).toString() };
}

async function manifestIcons(url) {
  try {
    const m = await (await get(url, 'application/json')).json();
    return (m.icons ?? [])
      .map((i) => ({ url: new URL(i.src, url).toString(), size: Number(String(i.sizes ?? '0').split('x')[0]) || 0 }))
      .sort((a, b) => b.size - a.size)
      .map((i) => i.url);
  } catch {
    return [];
  }
}

// Picks the largest PNG frame out of a .ico file; sharp cannot read ICO directly.
function icoLargestPng(buf) {
  if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) return null;
  let best = null;
  for (let i = 0; i < buf.readUInt16LE(4); i++) {
    const e = 6 + i * 16;
    const w = buf[e] || 256;
    const len = buf.readUInt32LE(e + 8);
    const off = buf.readUInt32LE(e + 12);
    const data = buf.subarray(off, off + len);
    if (data.subarray(1, 4).toString() === 'PNG' && (!best || w > best.w)) best = { w, data };
  }
  return best?.data ?? null;
}

async function toPng(url) {
  let buf = Buffer.from(await (await get(url, 'image/*')).arrayBuffer());
  if (/\.ico(\?|$)/i.test(url) || buf.readUInt16LE(0) === 0) {
    buf = icoLargestPng(buf);
    if (!buf) throw new Error('ico without PNG frame');
  }
  const img = sharp(buf, { density: 384 });
  const { width = 0 } = await img.metadata();
  if (width && width < 32) throw new Error(`too small (${width}px)`);
  return img.resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

async function fetchLogo(slug, site) {
  const origin = new URL(site).origin;
  let tried = [];
  try {
    const res = await get(site, 'text/html');
    const html = await res.text();
    const { links, manifest } = candidates(html, res.url);
    tried = links;
    if (manifest) tried.push(...(await manifestIcons(manifest)));
  } catch {}
  tried.push(`${origin}/apple-touch-icon.png`, `${origin}/favicon.ico`, `https://www.google.com/s2/favicons?domain=${new URL(site).hostname}&sz=128`);
  for (const url of [...new Set(tried)]) {
    try {
      writeFileSync(`${OUT}/${slug}.png`, await toPng(url));
      return url;
    } catch {}
  }
  return null;
}

const tools = readdirSync('data/tools')
  .filter((f) => f.endsWith('.yml'))
  .map((f) => ({ slug: f.replace(/\.yml$/, ''), ...parse(readFileSync(`data/tools/${f}`, 'utf8')) }))
  .filter((t) => t.status === 'published' && !SKIP.has(t.slug))
  .filter((t) => (only.length ? only.includes(t.slug) : all || !existsSync(`${OUT}/${t.slug}.png`)));

const missing = [];
let done = 0;
const queue = [...tools];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let t; (t = queue.shift()); ) {
      const from = await fetchLogo(t.slug, t.url);
      done++;
      if (!from) missing.push(t.slug);
      console.log(`${String(done).padStart(3)}/${tools.length} ${from ? 'ok  ' : 'none'} ${t.slug}${from ? `  ${from}` : ''}`);
    }
  }),
);
console.log(`logos: ${tools.length - missing.length} saved, ${missing.length} without an icon${missing.length ? `: ${missing.sort().join(', ')}` : ''}`);
