// Checks that every published listing's URL (and its sources) still answers.
// Usage: npm run links            (checks listing urls)
//        npm run links -- --sources   (also checks every source url)
// Exit code 1 when something is unreachable, so CI can open an issue instead of silently shipping dead links.
// Writes data/link-check.json: per listing, the last date its URL answered. Tool pages show it as "Link checked".
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { parse } from 'yaml';

const run = promisify(execFile);

const dir = new URL('../data/tools/', import.meta.url).pathname;
const withSources = process.argv.includes('--sources');
const UA = 'Mozilla/5.0 (compatible; kdp123-linkcheck/1.0; +https://kdp123.com)';

const targets = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
  const d = parse(readFileSync(join(dir, f), 'utf8'));
  if (d.status !== 'published') continue;
  targets.push({ id: f.replace(/\.yml$/, ''), kind: 'url', url: d.url });
  if (withSources) for (const s of d.sources ?? []) targets.push({ id: f.replace(/\.yml$/, ''), kind: 'source', url: s });
}

// curl rather than fetch(): several vendor sites sit behind bot protection that resets Node's TLS fingerprint
// but serves curl and browsers normally.
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

async function probe(url, ua) {
  const { stdout } = await run('curl', ['-sS', '-o', '/dev/null', '-L', '-m', '25', '-A', ua, '-w', '%{http_code} %{url_effective}', url]);
  const [code, final] = stdout.trim().split(' ');
  const status = Number(code);
  // 401/403/429 are bot walls (Reddit, Amazon, Cloudflare): the page exists but refuses scripts. Not a dead link.
  return { status, final, ok: (status >= 200 && status < 400) || [401, 403, 429].includes(status) };
}

async function check(t) {
  try {
    return { ...t, ...(await probe(t.url, UA)) };
  } catch (e) {
    // Some vendors reset connections from anything that announces itself as a bot. Retry as a browser: if that
    // works the page is alive, and we say so instead of reporting a dead link.
    try {
      const r = await probe(t.url, BROWSER_UA);
      return { ...t, ...r, note: 'only reachable with a browser user agent' };
    } catch (e2) {
      return { ...t, status: String(e2.stderr ?? e2.message).trim().split('\n')[0].slice(0, 80), ok: false };
    }
  }
}

const queue = [...targets];
const results = [];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (queue.length) results.push(await check(queue.shift()));
  }),
);

let bad = 0;
for (const r of results.sort((a, b) => a.id.localeCompare(b.id))) {
  const moved = r.ok && r.final && new URL(r.final).host.replace(/^www\./, '') !== new URL(r.url).host.replace(/^www\./, '');
  if (!r.ok) bad++;
  if (!r.ok || moved || r.note) console.log(`${r.ok ? (r.note ? 'BOT  ' : 'MOVED') : 'DEAD '} ${r.status} ${r.id} [${r.kind}] ${r.url}${moved ? ' -> ' + r.final : ''}${r.note ? ' (' + r.note + ')' : ''}`);
}
const ledgerPath = new URL('../data/link-check.json', import.meta.url).pathname;
const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);
for (const r of results.filter((r) => r.kind === 'url')) {
  ledger[r.id] = r.ok ? { ok: true, checked_at: today } : { ...ledger[r.id], ok: false, failed_at: today };
}
const sorted = Object.fromEntries(Object.entries(ledger).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(ledgerPath, JSON.stringify(sorted, null, 2) + '\n');

console.log(`${results.length} checked, ${bad} unreachable`);
process.exit(bad ? 1 : 0);
