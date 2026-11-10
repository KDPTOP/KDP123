// Refresh data/bsr-curve.json from KDPTop's public curve, so the BSR estimator works offline with the same numbers.
// Usage: node scripts/sync-kdptop.mjs   (writes only when the curve changed)
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../data/bsr-curve.json', import.meta.url);
const res = await fetch('https://kdptop.com/api/public/bsr-curve', { headers: { 'user-agent': 'kdp123-sync' } });
if (!res.ok) throw new Error(`KDPTop answered ${res.status}`);
const live = await res.json();
if (typeof live.exp !== 'number' || !live.A?.books || !live.A?.kindle) throw new Error('Unexpected curve format');

const old = JSON.parse(await readFile(FILE, 'utf8'));
const same = old.model === live.model && old.exp === live.exp && old.A.books === live.A.books && old.A.kindle === live.A.kindle;
if (same) {
  console.log(`bsr-curve: unchanged (${live.model})`);
} else {
  const next = { provider: 'kdptop', model: live.model, formula: live.formula, A: live.A, exp: live.exp, synced_at: new Date().toISOString().slice(0, 10) };
  await writeFile(FILE, `${JSON.stringify(next)}\n`);
  console.log(`bsr-curve: updated to ${live.model}, A=${JSON.stringify(live.A)}, exp=${live.exp}`);
}
