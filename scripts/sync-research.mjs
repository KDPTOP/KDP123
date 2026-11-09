// Pulls report summaries from the public KDPTop Research repository (CC BY 4.0) into data/research/reports.json.
// Usage: node scripts/sync-research.mjs. The site builds from the committed JSON, so builds never need the network.
import { mkdirSync, writeFileSync } from 'node:fs';

const REPO = 'ttion01/kdptop-research';
const RAW = `https://raw.githubusercontent.com/${REPO}/HEAD`;
const TREE = `https://github.com/${REPO}/tree/HEAD`;

async function text(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.text();
}

const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());
const link = (cell) => cell.match(/\[([^\]]+)\]\(([^)]+)\)/);
const plain = (s) => s.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();

const index = await text(`${RAW}/README.md`);
const rows = index
  .split('\n')
  .filter((l) => l.startsWith('| [') && l.includes('/research/'))
  .map(cells);

const reports = [];
for (const [titleCell, type, window, version, readmeCell, , dataCell] of rows) {
  const [, title, url] = link(titleCell);
  const readmePath = link(readmeCell)[2];
  const dir = readmePath.replace(/\/README\.md$/, '');
  const md = await text(`${RAW}/${readmePath}`);
  const lines = md.split('\n');

  const sample = plain(lines.find((l) => l.startsWith('**Sample**'))?.replace('**Sample**:', '') ?? '');
  const headIdx = lines.findIndex((l, i) => l.startsWith('| ') && lines[i + 1]?.startsWith('|---'));
  const headline =
    headIdx >= 0 ? cells(lines[headIdx]).map((label, i) => ({ label, value: plain(cells(lines[headIdx + 2])[i] ?? '') })) : [];
  const intro = lines.slice(0, headIdx >= 0 ? headIdx : 20).filter((l) => l && !/^(#|>|\*\*|中文|\|)/.test(l)).map(plain)[0] ?? '';
  const kf = lines.findIndex((l) => /^## Key findings/i.test(l));
  const findings = [];
  for (let i = kf + 1; kf >= 0 && i < lines.length && !lines[i].startsWith('## '); i++) {
    const m = lines[i].match(/^\d+\.\s+(.*)/);
    if (m) findings.push(plain(m[1]));
  }

  reports.push({
    slug: dir.split('/').pop(),
    title,
    type,
    window: window.replace(/\s+–\s+/, ' to '),
    version,
    url,
    summary: intro,
    sample,
    headline,
    findings,
    data_url: `${TREE}/${link(dataCell)[2].replace(/\/$/, '')}`,
    source_url: `${TREE}/${dir}`,
  });
}

mkdirSync(new URL('../data/research/', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../data/research/reports.json', import.meta.url),
  JSON.stringify({ source: `https://github.com/${REPO}`, license: 'CC BY 4.0', fetched_at: new Date().toISOString().slice(0, 10), reports }, null, 2) + '\n',
);
console.log(`${reports.length} reports written to data/research/reports.json`);
