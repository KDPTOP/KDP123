// Generates the logo lockups and icon files in public/ from public/logo-mark.svg.
// Run after editing the mark: node scripts/brand.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const NAVY = '#111a2e';
const ORANGE = '#ff7a0a';
const font = readFileSync('node_modules/@fontsource/inter/files/inter-latin-800-normal.woff');
const mark = readFileSync('public/logo-mark.svg', 'utf8');
const markInner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

async function wordmark(kdpColor) {
  const svg = await satori(
    { type: 'div', props: { style: { display: 'flex', fontSize: 100, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }, children: [
      { type: 'span', props: { style: { color: kdpColor }, children: 'KDP' } },
      { type: 'span', props: { style: { color: ORANGE }, children: '123' } },
    ] } },
    { width: 420, height: 100, fonts: [{ name: 'Inter', data: font, weight: 800, style: 'normal' }] },
  );
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}

function lockup(words, bg) {
  // Mark 100x112 scaled to 96 high, wordmark 420x100 scaled to 80 high, 22 gap.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 112" role="img" aria-label="KDP123">
${bg ? `<rect width="400" height="112" fill="${bg}"/>` : ''}<svg x="0" y="8" width="86" height="96" viewBox="0 0 100 112">${markInner}</svg>
<svg x="104" y="18" width="336" height="80" viewBox="0 0 420 100">${words}</svg>
</svg>
`;
}

writeFileSync('public/logo-horizontal-light.svg', lockup(await wordmark(NAVY)));
writeFileSync('public/logo-horizontal-dark.svg', lockup(await wordmark('#ffffff')));

const icon = (bg, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg ? `<rect width="512" height="512" fill="${bg}"/>` : ''}<svg x="${256 - 230 * scale}" y="${256 - 258 * scale}" width="${460 * scale}" height="${516 * scale}" viewBox="0 0 100 112">${markInner}</svg></svg>`;
// Browser-tab icon: the mark on a white rounded tile with a hairline border, as on the brand board,
// so it reads at 16px on light and dark tab bars.
const tile = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="8" y="8" width="496" height="496" rx="112" fill="#ffffff" stroke="#d9dde5" stroke-width="16"/><svg x="${256 - 230 * scale}" y="${256 - 258 * scale}" width="${460 * scale}" height="${516 * scale}" viewBox="0 0 100 112">${markInner}</svg></svg>`;
const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

writeFileSync('public/favicon.svg', tile(0.74));
const small = {};
for (const s of [16, 32, 48]) small[s] = png(tile(s === 16 ? 0.8 : 0.74), s);
for (const s of [16, 32, 48]) writeFileSync(`public/favicon-${s}.png`, small[s]);
writeFileSync('public/apple-touch-icon.png', png(icon('#ffffff', 0.78), 180));
writeFileSync('public/icon-192.png', png(icon('#ffffff', 0.78), 192));
writeFileSync('public/icon-512.png', png(icon('#ffffff', 0.78), 512));
writeFileSync('public/icon-maskable-512.png', png(icon(NAVY, 0.6), 512));

// favicon.ico holding the 16/32/48 PNGs.
const sizes = [16, 32, 48];
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const at = 6 + 16 * i;
  header.writeUInt8(s, at); header.writeUInt8(s, at + 1); header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(small[s].length, at + 8); header.writeUInt32LE(offset, at + 12);
  offset += small[s].length;
});
writeFileSync('public/favicon.ico', Buffer.concat([header, ...sizes.map((s) => small[s])]));

writeFileSync('public/site.webmanifest', JSON.stringify({
  name: 'KDP123',
  short_name: 'KDP123',
  description: 'Amazon KDP tools, rules and resources, checked and compared.',
  start_url: '/',
  display: 'browser',
  background_color: '#fbfbfa',
  theme_color: NAVY,
  icons: [
    { src: '/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png?v=2', sizes: '512x512', type: 'image/png' },
    { src: '/icon-maskable-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2) + '\n');
console.log('Brand files written to public/.');
