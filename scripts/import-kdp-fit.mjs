// Imports verified KDP fit, audience and pricing-term data (JSON Lines, one tool per line) into data/tools/*.yml.
// The input format is described in the verification brief written by scripts/grok-brief.mjs.
//   node scripts/import-kdp-fit.mjs results.jsonl            dry run: report what would change
//   node scripts/import-kdp-fit.mjs results.jsonl --write    apply
// Rules: a claim without a source URL on the vendor's own site is rejected, never guessed. Unverified stays unverified.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseDocument } from 'yaml';

const FIT_SCOPES = ['cover', 'interior', 'ebook', 'print'];
const FIT_LEVELS = ['native', 'manual', 'na', 'unverified'];
const PER = ['user', 'team', 'book'];
const OFFICIAL_HOSTS = ['amazon.com', 'kdp.amazon.com', 'audible.com', 'acx.com'];

const [file] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const write = process.argv.includes('--write');
if (!file || !existsSync(file)) {
  console.error('usage: node scripts/import-kdp-fit.mjs <results.jsonl> [--write]');
  process.exit(1);
}

const base = (host) => host.replace(/^www\./, '').split('.').slice(-2).join('.');
const today = new Date().toISOString().slice(0, 10);
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= today;
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

let accepted = 0;
let rejected = 0;
const touched = [];

for (const [n, line] of readFileSync(file, 'utf8').split('\n').entries()) {
  if (!line.trim()) continue;
  const where = `line ${n + 1}`;
  let r;
  try {
    r = JSON.parse(line);
  } catch (e) {
    console.log(`REJECT ${where}: not JSON (${e.message})`);
    rejected++;
    continue;
  }
  const path = `data/tools/${r.id}.yml`;
  if (!r.id || !existsSync(path)) {
    console.log(`REJECT ${where}: unknown id ${r.id}`);
    rejected++;
    continue;
  }
  const doc = parseDocument(readFileSync(path, 'utf8'));
  const tool = doc.toJS();
  const vendor = base(new URL(tool.url).hostname);
  const checked = isDate(r.checked_at) ? r.checked_at : today;
  const log = [];
  const reject = (field, why) => {
    log.push(`  - ${field}: rejected, ${why}`);
    rejected++;
  };
  // A source must be a page on the vendor's own site (any subdomain), or Amazon's for official listings.
  const sourceOk = (url) => {
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) return false;
      const b = base(u.hostname);
      return b === vendor || (tool.official && OFFICIAL_HOSTS.some((h) => u.hostname.endsWith(h)));
    } catch {
      return false;
    }
  };
  const claim = (field, c, { needsEvidence = false } = {}) => {
    if (!c || !c.source) return reject(field, 'no source'), false;
    if (!sourceOk(c.source)) return reject(field, `source is not on ${vendor}: ${c.source}`), false;
    if (needsEvidence && clean(c.evidence).length < 8) return reject(field, 'no evidence quote'), false;
    return true;
  };

  const sources = new Set();
  let featuresChanged = false;
  let priceChanged = false;

  if (r.kdp_fit) {
    const fit = { ...(tool.kdp_fit ?? {}) };
    for (const k of FIT_SCOPES) {
      const c = r.kdp_fit[k];
      if (!c || c.level === undefined || c.level === 'unverified') continue;
      if (!FIT_LEVELS.includes(c.level)) {
        reject(`kdp_fit.${k}`, `unknown level ${c.level}`);
        continue;
      }
      if (!claim(`kdp_fit.${k}`, c, { needsEvidence: true })) continue;
      if (fit[k] !== c.level) log.push(`  + kdp_fit.${k}: ${fit[k] ?? 'unverified'} -> ${c.level}`);
      fit[k] = c.level;
      sources.add(c.source);
      accepted++;
    }
    const steps = (r.manual_steps ?? []).filter((m) => claim('manual_steps', m)).map((m) => (sources.add(m.source), clean(m.text)).slice(0, 160));
    if (sources.size) {
      for (const k of FIT_SCOPES) fit[k] ??= 'unverified';
      fit.manual_steps = steps.length ? steps : (fit.manual_steps ?? []);
      fit.sources = [...new Set([...(fit.sources ?? []), ...sources])];
      fit.checked_at = checked;
      doc.set('kdp_fit', doc.createNode(fit));
      featuresChanged = true;
      if (steps.length) log.push(`  + manual_steps: ${steps.length}`);
    }
  }

  for (const field of ['best_for', 'not_ideal_for']) {
    const items = (r[field] ?? []).filter((x) => clean(x.text).length >= 8 && claim(field, x)).map((x) => clean(x.text).slice(0, 120));
    if (!items.length) continue;
    doc.set(field, doc.createNode(items));
    log.push(`  + ${field}: ${items.join(' | ')}`);
    featuresChanged = true;
    accepted += items.length;
  }

  const p = r.pricing ?? {};
  const pricing = tool.pricing ?? {};
  const setPrice = (key, value) => {
    if (pricing[key] === value) return;
    log.push(`  + pricing.${key}: ${pricing[key] ?? '-'} -> ${value}`);
    doc.setIn(['pricing', key], value);
    priceChanged = true;
    accepted++;
  };
  if (p.annual_from && claim('pricing.annual_from', p.annual_from, { needsEvidence: true })) {
    const v = Number(p.annual_from.value);
    if (!(v >= 0)) reject('pricing.annual_from', 'not a number');
    else if ((p.annual_from.currency ?? 'USD') !== (pricing.currency ?? 'USD')) reject('pricing.annual_from', `currency differs from ${pricing.currency}`);
    else setPrice('annual_from', v);
  }
  if (p.per && claim('pricing.per', p.per)) {
    if (!PER.includes(p.per.value)) reject('pricing.per', `must be one of ${PER.join(', ')}`);
    else setPrice('per', p.per.value);
  }
  if (p.trial_days && claim('pricing.trial_days', p.trial_days, { needsEvidence: true })) {
    const v = Number(p.trial_days.value);
    if (!Number.isInteger(v) || v <= 0) reject('pricing.trial_days', 'not a whole number of days');
    else setPrice('trial_days', v);
  }
  if (p.region_note && claim('pricing.region_note', p.region_note)) {
    const v = clean(p.region_note.value);
    if (v.length < 10) reject('pricing.region_note', 'too short');
    else setPrice('region_note', v.slice(0, 160));
  }

  if (featuresChanged) doc.set('features_checked_at', checked);
  if (priceChanged) {
    doc.set('price_checked_at', checked);
    if (p.annual_from && doc.getIn(['pricing', 'annual_from']) !== pricing.annual_from) {
      const history = doc.get('price_history');
      const note = `Yearly billing read on the vendor's pricing page: from ${pricing.currency === 'USD' || !pricing.currency ? '$' : pricing.currency + ' '}${doc.getIn(['pricing', 'annual_from'])}/mo billed yearly.`;
      const row = doc.createNode({ date: checked, kind: 'plan', note });
      if (history && history.items) history.items.unshift(row);
      else doc.set('price_history', doc.createNode([{ date: checked, kind: 'plan', note }]));
    }
  }

  console.log(`${r.id}${log.length ? '' : ': nothing to change'}`);
  for (const l of log) console.log(l);
  if ((featuresChanged || priceChanged) && write) {
    writeFileSync(path, doc.toString({ lineWidth: 0 }).replace(/: \[ (.*?) \]$/gm, ': [$1]'));
    touched.push(r.id);
  } else if (featuresChanged || priceChanged) touched.push(r.id);
}

if (write && touched.length) {
  const logFile = 'data/changelog.json';
  const entries = JSON.parse(readFileSync(logFile, 'utf8'));
  entries.unshift({
    date: today,
    note: `Checked KDP fit, audience and pricing terms for ${touched.length} ${touched.length === 1 ? 'tool' : 'tools'} against each vendor's own pages: ${touched.join(', ')}.`,
  });
  writeFileSync(logFile, JSON.stringify(entries, null, 2) + '\n');
}
console.log(`\n${accepted} claims accepted, ${rejected} rejected, ${touched.length} tools ${write ? 'updated' : 'would change (dry run; add --write)'}`);
