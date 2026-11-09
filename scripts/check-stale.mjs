// Lists published tools and facts whose last human check is older than the limit.
// Usage: node scripts/check-stale.mjs [days]   (default 120). Exit code 1 when anything is stale.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const days = Number(process.argv[2] ?? 120);
const cutoff = Date.now() - days * 86_400_000;
const root = new URL('../data/', import.meta.url).pathname;

const read = (kind, file) => {
  const text = readFileSync(join(root, kind, file), 'utf8');
  const yaml = kind === 'facts' ? (text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '') : text;
  return parse(yaml) ?? {};
};

const stale = [];
for (const kind of ['tools', 'facts']) {
  let files = [];
  try {
    files = readdirSync(join(root, kind)).filter((f) => /\.(yml|md)$/.test(f));
  } catch {
    continue;
  }
  for (const f of files) {
    const d = read(kind, f);
    if (d.status !== 'published') continue;
    const checked = d.verified_at ? new Date(d.verified_at).getTime() : 0;
    if (checked < cutoff) stale.push(`${kind}/${f.replace(/\.(yml|md)$/, '')} last checked ${d.verified_at ?? 'never'}`);
  }
}

for (const s of stale.sort()) console.log(`STALE ${s}`);
console.log(`${stale.length} entries not checked in ${days} days`);
process.exit(stale.length ? 1 : 0);
