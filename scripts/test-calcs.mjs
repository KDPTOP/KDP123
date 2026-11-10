// Hand-checked cases for every calculator's logic, run against the TypeScript sources with Node's type stripping.
//   node scripts/test-calcs.mjs
// Expected numbers are worked out by hand from the formulas on each tool page, not copied from the code's output.
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

// The site imports TS modules without extensions and JSON without import attributes (Vite allows both).
registerHooks({
  resolve(spec, ctx, next) {
    if ((spec.startsWith('.') || spec.startsWith('/')) && !/\.[cm]?[jt]s$|\.json$/.test(spec)) {
      const url = new URL(`${spec}.ts`, ctx.parentURL);
      if (existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
    }
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url.endsWith('.json')) return { format: 'module', source: `export default ${readFileSync(fileURLToPath(url), 'utf8')};`, shortCircuit: true };
    return next(url, ctx);
  },
});

const mod = (p) => import(pathToFileURL(p).href);
const near = (actual, expected, tol = 1e-6, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}, got ${actual}`);
const ymd = (d) => d.toISOString().slice(0, 10);

let passed = 0;
const failures = [];
async function suite(name, fn) {
  try {
    await fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

await suite('royalty', async () => {
  const r = await mod('src/lib/calc/royalty.ts');
  assert.equal(r.printCost('paperback', 'black', 'regular', 300), 4.6); // 1 + 300 x 0.012
  assert.equal(r.printCost('paperback', 'black', 'regular', 100), 2.3);
  assert.equal(r.printCost('paperback', 'black', 'large', 100), 2.84);
  assert.equal(r.printCost('hardcover', 'black', 'regular', 200), 8.05); // 5.65 + 200 x 0.012
  assert.equal(r.calculate({ format: 'paperback', price: 12.99, pages: 300 }).royalty, 3.19); // 0.6 x 12.99 - 4.60
  assert.equal(r.calculate({ format: 'paperback', price: 9.98, pages: 300 }).rate, 0.5);
  assert.equal(r.ebookRoyalty(4.99, 1).royalty, 3.39); // 0.7 x (4.99 - 0.15)
  assert.equal(r.ebookRoyalty(13.99).rate, 0.35);
  assert.equal(r.ebookRoyalty(13.99).royalty, 4.9); // 0.35 x 13.99
  assert.throws(() => r.printCost('paperback', 'black', 'regular', 20), r.RuleError);
  assert.equal(r.trimClass(6, 9), 'regular');
  assert.equal(r.trimClass(7, 10), 'large');
});

await suite('cover and ebook price (listing)', async () => {
  const l = await mod('src/lib/calc/listing.ts');
  const c = l.paperbackCover(6, 9, 300, 'white');
  near(c.spine, 0.6756); // 300 x 0.002252
  near(c.width, 12.9256); // 0.125 + 6 + 0.6756 + 6 + 0.125
  near(c.height, 9.25);
  assert.equal(c.spineText, true);
  assert.equal(l.paperbackCover(6, 9, 301, 'cream').pages, 302);
  assert.equal(l.paperbackCover(6, 9, 78, 'white').spineText, false);
  assert.equal(l.px300(12.9256), 3878);
  const p = l.ebookPriceCheck(9.99, 1, 14.99);
  assert.equal(p.max70, 11.99); // 20% below 14.99, under the 12.99 cap
  assert.equal(p.ok70, true);
  assert.equal(l.ebookPriceCheck(0.99, 5).ok35, false); // 3 MB+ starts at 1.99
  assert.equal(l.ebookPriceCheck(12.99, 1, 14.99).ok70, false);
});

await suite('cover image check', async () => {
  const { imageCheck } = await mod('src/tools/cover-size-calculator/logic.ts');
  assert.deepEqual(imageCheck(3878, 2775, 3878, 2775), { ok: true, dpi: 300, ratioOff: false });
  const half = imageCheck(1939, 1388, 3878, 2775);
  assert.equal(half.ok, false);
  assert.equal(half.dpi, 150);
  assert.equal(imageCheck(3000, 3000, 3878, 2775).ratioOff, true);
});

await suite('bsr', async () => {
  const b = await mod('src/lib/calc/bsr.ts');
  assert.equal(b.dailySales(1000), 34); // 12000 / 1000^0.85 = 33.8
  assert.equal(b.dailySales(25000), 2.2); // 12000 / 25000^0.85 = 2.19
  assert.equal(b.dailySales(1000, 'kindle'), 51); // 18000 / 354.8
  assert.equal(b.dailySales(0), null);
  near(b.rankFor(33.82), 1000, 2);
});

await suite('title length', async () => {
  const { checkTitle, TITLE_MAX } = await mod('src/tools/title-length-checker/logic.ts');
  const ok = checkTitle('The Quiet Garden', 'A Novel of Second Chances');
  assert.equal(ok.total, 41);
  assert.equal(ok.left, 158);
  assert.ok(!ok.issues.some(([l]) => l === 'error'));
  const long = checkTitle('a'.repeat(150), 'b'.repeat(60));
  assert.equal(long.total, 210);
  assert.ok(long.issues.some(([l, m]) => l === 'error' && m.includes('Cut 11')));
  const bad = checkTitle('Free Bestselling Journal', 'Gratitude Journal');
  assert.ok(bad.issues.filter(([l]) => l === 'error').length >= 2);
  assert.ok(bad.issues.some(([l, m]) => l === 'warn' && m.includes('journal')));
  assert.equal(TITLE_MAX, 199);
});

await suite('keyword builder', async () => {
  const k = await mod('src/tools/keyword-builder/logic.ts');
  const r = k.build(k.splitIdeas('cozy mystery, cozy mysteries, Cozy-Mystery, free kindle books, baking mystery'));
  assert.deepEqual(r.slots, ['cozy mystery', 'baking mystery']);
  assert.deepEqual(r.duplicates, ['cozy mysteries', 'cozy-mystery']);
  assert.equal(r.dropped.length, 1);
  const t = k.build(['small town mystery', 'amateur sleuth'], { title: 'Small Town Secrets' });
  assert.deepEqual(t.inTitle, [['small town mystery', ['small', 'town']]]);
  const many = k.build(Array.from({ length: 10 }, (_, i) => `idea ${'abcdefghij'[i]}`));
  assert.equal(many.slots.length, 7);
  assert.equal(many.leftovers.length, 3);
});

await suite('payment date', async () => {
  const p = await mod('src/tools/kdp-payment-date/logic.ts');
  assert.equal(ymd(p.paymentDate(2026, 1)), '2026-03-31'); // January sales paid end of March
  assert.equal(ymd(p.paymentDate(2026, 1, 'expanded')), '2026-04-30');
  assert.equal(ymd(p.paymentDate(2026, 11)), '2027-01-31');
  assert.equal(ymd(p.paymentDate(2027, 3)), '2027-05-31');
  const [a, b] = p.arrivalWindow(p.paymentDate(2027, 3), 'deposit');
  assert.equal(ymd(a), '2027-06-01'); // Mon May 31 + 1 business day
  assert.equal(ymd(b), '2027-06-07'); // + 5 business days
  assert.equal(ymd(p.addBusinessDays(new Date('2026-11-13T00:00:00Z'), 1)), '2026-11-16'); // Friday -> Monday
});

await suite('kenp', async () => {
  const k = await mod('src/tools/kenp-calculator/logic.ts');
  near(k.earnings(10000, 0.0045), 45);
  near(k.perFullRead(300, 0.0045), 1.35);
  near(k.perFullRead(5000, 0.0045), 13.5); // capped at 3,000 KENP
  assert.equal(k.pagesToMatchSale(3.4, 0.0045), 756); // 3.40 / 0.0045 = 755.6
  near(k.fullReads(25000, 350), 71.43, 0.01);
});

await suite('ads acos', async () => {
  const { ads, reportAcos } = await mod('src/tools/amazon-ads-acos-calculator/logic.ts');
  const r = ads({ price: 12.99, royalty: 3.19, cpc: 0.65, cvr: 10 });
  near(r.breakEvenAcos, 0.2456, 0.0001); // 3.19 / 12.99
  near(r.costPerSale, 6.5); // 0.65 / 0.10
  near(r.acos, 0.5004, 0.0001); // 6.50 / 12.99
  near(r.profitPerSale, -3.31);
  near(r.maxCpc, 0.319); // 3.19 x 0.10
  near(reportAcos(120, 300), 0.4);
  assert.equal(reportAcos(50, 0), Infinity);
});

await suite('word count to pages', async () => {
  const w = await mod('src/tools/word-count-to-page-count/logic.ts');
  // Text block (6 - 0.75 - 0.5) x 72 = 342 pt wide, 7.5 x 72 = 540 pt tall; 342 / 5.5 = 62.2 chars a line;
  // floor(540 / 13.2) = 40 lines; 62.2 / 6 x 40 x 0.85 = 352 words a page.
  const r = w.estimatePages(80000, 6, 9, 11, 25, 8);
  assert.equal(r.wordsPerPage, 352);
  assert.equal(r.textPages, 228); // ceil(80000 / 352)
  assert.equal(r.pages, 250); // 228 + 13 + 8 = 249, rounded up to even
  assert.equal(w.estimatePages(1000, 6, 9, 11, 0, 0).pages, 24);
  assert.ok(w.estimatePages(80000, 6, 9, 14, 25, 8).pages > 250);
});

await suite('interior margins', async () => {
  const m = await mod('src/tools/interior-margin-calculator/logic.ts');
  const a = m.margins(6, 9, 240, false);
  assert.deepEqual([a.gutter, a.outside, a.pageW, a.pageH], [0.5, 0.25, 6, 9]);
  near(a.textW, 5.25);
  near(a.textH, 8.5);
  const b = m.margins(6, 9, 140, true);
  assert.deepEqual([b.gutter, b.outside, b.pageW, b.pageH], [0.375, 0.375, 6.125, 9.25]);
  near(b.textW, 5.375);
  assert.equal(m.gutterFor(700), 0.75);
  assert.equal(m.gutterFor(701), 0.875);
  assert.equal(m.mm(0.375), 9.6);
  assert.equal(m.mm(0.25), 6.4);
  assert.equal(m.mm(0.875), 22.3);
});

await suite('isbn', async () => {
  const i = await mod('src/tools/isbn-validator/logic.ts');
  const ok = i.validate('978-0-306-40615-7'); // weighted sum 93 -> check 7
  assert.equal(ok.valid, true);
  assert.equal(ok.isbn10, '0306406152');
  const typo = i.validate('9780306406158');
  assert.equal(typo.valid, false);
  assert.equal(typo.expected, '7');
  const x = i.validate('0-8044-2957-X');
  assert.equal(x.valid, true);
  assert.equal(x.isbn13, '9780804429573'); // 978080442957 weighted sum 117 -> check 3
  assert.equal(i.check10('030640615'), '2');
  assert.equal(i.validate('12345').kind, 'invalid');
  assert.equal(i.ean13Bits('9780306406157').length, 95);
});

await suite('pre-order deadlines', async () => {
  const p = await mod('src/tools/preorder-deadline-calculator/logic.ts');
  const e = p.ebookPlan('2027-03-01', '2026-10-01');
  assert.equal(ymd(e.fileDeadline), '2027-02-26');
  assert.equal(ymd(e.latestRelease), '2028-04-01'); // 18 months after setup
  assert.equal(ymd(e.latestPostpone), '2027-09-01'); // 6 months after release
  assert.equal(e.tooFar, false);
  const old = p.ebookPlan('2027-12-01', '2026-08-01');
  assert.equal(old.leadMonths, 12);
  assert.equal(old.tooFar, true);
  const pr = p.printPlan('2027-01-10', '2026-11-10');
  assert.equal(ymd(pr.lockFrom), '2027-01-05');
  assert.equal(ymd(pr.latestRelease), '2027-02-08'); // 90 days ahead
  assert.equal(p.printPlan('2027-03-01', '2026-11-10').tooFar, true);
});

await suite('command box intents', async () => {
  const t = await mod('src/tools/intents.ts');
  const r = t.intents('$12.99 200 pages');
  assert.equal(r[0].slug, 'royalty-calculator');
  assert.equal(r[0].params.price, '12.99');
  assert.equal(r[0].params.pages, '200');
  assert.equal(t.extract('80k words').words, '80000');
  assert.equal(t.intents('80k words')[0].slug, 'word-count-to-page-count');
  assert.equal(t.intents('BSR 25000')[0].params.rank, '25000');
  assert.ok(t.intents('9780306406157').some((x) => x.slug === 'isbn-validator'));
});

const total = passed + failures.length;
if (failures.length) {
  console.error(`test-calcs: ${failures.length} of ${total} suites failed`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`test-calcs: ${total} suites passed`);
