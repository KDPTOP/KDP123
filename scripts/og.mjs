// Writes a 1200x630 social image for every built page: dist/og/<path>.png, matching ogImagePath() in src/lib/seo.ts.
// Runs after `astro build`. Images are cached by content in node_modules/.cache/og so unchanged pages are not re-rendered.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, globSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const DIST = 'dist';
const CACHE = 'node_modules/.cache/og';
const fonts = [600, 800].map((weight) => ({
  name: 'Inter',
  weight,
  style: 'normal',
  data: readFileSync(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`),
}));
const logo = `data:image/svg+xml;base64,${readFileSync('public/logo-horizontal-light.svg').toString('base64')}`;
const mark = `data:image/svg+xml;base64,${readFileSync('public/logo-mark.svg').toString('base64')}`;
const VERSION = createHash('sha1').update(readFileSync('scripts/og.mjs')).update(logo).digest('hex').slice(0, 8);

const LABELS = [
  [/^t\//, 'Tool listing'],
  [/^c\//, 'Tool category'],
  [/^stages\//, 'KDP tools by stage'],
  [/^facts\/./, 'KDP rule, sourced to Amazon'],
  [/^best\/./, 'Shortlist'],
  [/^compare\/./, 'Comparison'],
  [/^free-tools\/./, 'Free calculator'],
  [/^reports\/./, 'Monthly market report'],
  [/^glossary/, 'Glossary'],
];
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function pageInfo(file) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(DIST, dirname(file)).replace(/\\/g, '/');
  const og = html.match(/<meta property="og:title" content="([^"]*)"/);
  const date = html.match(/<meta property="article:modified_time" content="([^"]*)"/);
  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  let title = unescape((h1 ? h1[1].replace(/<[^>]+>/g, '') : og?.[1] ?? 'KDP123').replace(/\s+/g, ' ').trim());
  if (!rel) title = 'Find the right Amazon KDP tools for your next book';
  const label = LABELS.find(([re]) => re.test(rel))?.[1] ?? 'Amazon KDP tools and resources';
  let sub = rel && title.length <= 44 && desc ? unescape(desc[1]).replace(`${title}: `, '') : '';
  if (sub.length > 120) sub = sub.slice(0, sub.lastIndexOf(' ', 117)).replace(/[,.;:]$/, '') + '…';
  return { rel, title, label, sub, date: date?.[1] };
}

function card({ title, label, sub, date }) {
  const size = title.length > 70 ? 54 : title.length > 40 ? 64 : 76;
  return {
    type: 'div',
    props: {
      style: { width: 1200, height: 630, display: 'flex', position: 'relative', background: '#fbfbfa', fontFamily: 'Inter', color: '#111a2e', overflow: 'hidden' },
      children: [
        { type: 'img', props: { src: mark, width: 520, height: 582, style: { position: 'absolute', right: -90, bottom: -150, opacity: 0.16 } } },
        { type: 'div', props: { style: { position: 'absolute', left: 0, top: 0, width: 16, height: 630, background: '#ff7a0a' } } },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 80px 56px 88px', width: '100%' },
            children: [
              { type: 'img', props: { src: logo, width: 286, height: 80 } },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    { type: 'div', props: { style: { display: 'flex', fontSize: 26, fontWeight: 600, color: '#c2410c', textTransform: 'uppercase', letterSpacing: 2 }, children: label } },
                    { type: 'div', props: { style: { display: 'flex', marginTop: 18, fontSize: size, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 980 }, children: title } },
                    ...(sub ? [{ type: 'div', props: { style: { display: 'flex', marginTop: 22, fontSize: 30, fontWeight: 600, lineHeight: 1.35, color: '#5b6270', maxWidth: 900 }, children: sub } }] : []),
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 600, color: '#5b6270' },
                  children: [
                    { type: 'div', props: { style: { display: 'flex' }, children: 'kdp123.com' } },
                    { type: 'div', props: { style: { display: 'flex' }, children: date ? `Checked ${date}` : 'Prices, sources and check dates' } },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

mkdirSync(CACHE, { recursive: true });
let rendered = 0;
let cached = 0;
for (const file of globSync(`${DIST}/**/index.html`)) {
  const info = pageInfo(file);
  const key = createHash('sha1').update(VERSION + JSON.stringify(info)).digest('hex');
  const hit = join(CACHE, `${key}.png`);
  const out = join(DIST, 'og', `${info.rel || 'index'}.png`);
  mkdirSync(dirname(out), { recursive: true });
  if (existsSync(hit)) {
    cached++;
  } else {
    const svg = await satori(card(info), { width: 1200, height: 630, fonts });
    writeFileSync(hit, new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: false } }).render().asPng());
    rendered++;
  }
  copyFileSync(hit, out);
}
console.log(`og: ${rendered} rendered, ${cached} from cache`);
