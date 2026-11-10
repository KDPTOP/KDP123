// Builds the monthly email from data/reports/YYYY-MM.json and saves it as a Resend broadcast draft (never sends).
// Usage: RESEND_API_KEY=re_... node scripts/newsletter-draft.mjs [YYYY-MM]   (defaults to the newest report)
// Without RESEND_API_KEY it writes newsletter-YYYY-MM.html and .txt for review instead.
// Review the draft in the Resend dashboard, send a test to yourself, then send it to the "kdp123 newsletter" segment.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const SITE = 'https://kdp123.com';
const SEGMENT_ID = 'c27be705-538f-49d8-9f78-6f6b8ad69133';
const FROM = 'kdp123 <news@kdp123.com>';

const month = process.argv[2] ?? readdirSync('data/reports').filter((f) => f.endsWith('.json')).sort().pop().slice(0, 7);
const r = JSON.parse(readFileSync(`data/reports/${month}.json`, 'utf8'));
const name = new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const reportUrl = `${SITE}/reports/${month}/`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const leaf = (path) => path.split(' > ').pop();
const { kdptop: k, kdp123: o } = r;
const top = k.top_categories.slice(0, 5);
const sameTeam = (id) => /^related_to_directory:\s*true/m.test(readFileSync(`data/tools/${id}.yml`, 'utf8'));
for (const c of o.price_changes) if (sameTeam(c.id)) c.name += ' (run by the same team as kdp123)';
const changes = o.price_changes.filter((c) => c.kind !== 'correction');
const corrections = o.price_changes.filter((c) => c.kind === 'correction');

const sections = [
  {
    title: 'Categories with room for new books',
    intro: `From KDPTop's daily Amazon.com list data (${k.data_date}), the highest opportunity scores, with median price and reviews on each Best Sellers list:`,
    items: top.map((c) => ({ text: `${leaf(c.category)} (${c.store === 'kindle' ? 'Kindle' : 'print'}): score ${c.opportunity_score}, median $${c.median_price_usd?.toFixed(2)}, ${c.median_reviews} reviews`, url: c.url })),
    more: { text: `All ${k.top_categories.length} categories and the CSV`, url: reportUrl },
  },
  changes.length && {
    title: 'Tool price and plan changes',
    items: changes.map((c) => ({ text: `${c.name}: ${c.note}`, url: `${SITE}/t/${c.id}/` })),
  },
  corrections.length && {
    title: 'Corrections to our listings',
    intro: 'Where we had a price wrong and fixed it against the vendor\'s own page:',
    items: corrections.map((c) => ({ text: `${c.name}: ${c.note}`, url: `${SITE}/t/${c.id}/` })),
  },
  o.new_listings.length && {
    title: `${o.new_listings.length} new listings`,
    items: o.new_listings.slice(0, 10).map((t) => ({ text: t.name, url: `${SITE}/t/${t.id}/` })),
    more: o.new_listings.length > 10 ? { text: `All ${o.new_listings.length} in the report`, url: reportUrl } : null,
  },
  o.facts_checked.length && {
    title: 'KDP rules checked against Amazon',
    items: o.facts_checked.slice(0, 8).map((f) => ({ text: f.title, url: `${SITE}/facts/${f.id}/` })),
  },
].filter(Boolean);

const subject = `kdp123 · ${name}: ${top[0] ? `${leaf(top[0].category)} leads, ` : ''}${o.price_changes.length} price changes`;
const footer = 'Market figures: KDPTop (kdptop.com), run by the same team as kdp123, CC BY 4.0. No vendor pays to appear in this email.';

const html = `<!doctype html><html><body style="margin:0;background:#fbfbfa">
<div style="max-width:600px;margin:0 auto;padding:24px;font:16px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#14171f">
<p style="font-weight:700;font-size:18px;margin:0 0 4px">kdp123</p>
<h1 style="font-size:24px;margin:0 0 16px">The KDP month: ${esc(name)}</h1>
<p style="margin:0 0 24px">The full report with every table and CSV: <a href="${reportUrl}" style="color:#1f4fd6">${reportUrl}</a></p>
${sections
  .map(
    (s) => `<h2 style="font-size:18px;margin:24px 0 8px">${esc(s.title)}</h2>
${s.intro ? `<p style="margin:0 0 8px;color:#5b6270;font-size:14px">${esc(s.intro)}</p>` : ''}
<ul style="margin:0;padding-left:20px">${s.items.map((i) => `<li style="margin:4px 0">${i.url ? `<a href="${i.url}" style="color:#1f4fd6">${esc(i.text)}</a>` : esc(i.text)}</li>`).join('')}</ul>
${s.more ? `<p style="margin:8px 0 0;font-size:14px"><a href="${s.more.url}" style="color:#1f4fd6">${esc(s.more.text)}</a></p>` : ''}`,
  )
  .join('\n')}
<hr style="border:0;border-top:1px solid #e3e6ec;margin:32px 0 16px">
<p style="font-size:12px;color:#5b6270;margin:0">${esc(footer)} Reply to this email or write to hello@kdp123.com.<br>
<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#5b6270">Unsubscribe</a></p>
</div></body></html>`;

const text = [
  `kdp123 · The KDP month: ${name}`,
  `Full report: ${reportUrl}`,
  ...sections.flatMap((s) => ['', s.title.toUpperCase(), ...(s.intro ? [s.intro] : []), ...s.items.map((i) => `- ${i.text}${i.url ? ` ${i.url}` : ''}`), ...(s.more ? [`${s.more.text}: ${s.more.url}`] : [])]),
  '',
  footer,
  'Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}',
].join('\n');

if (!process.env.RESEND_API_KEY) {
  writeFileSync(`newsletter-${month}.html`, html);
  writeFileSync(`newsletter-${month}.txt`, text);
  console.log(`Wrote newsletter-${month}.html and .txt. Subject: ${subject}`);
} else {
  const res = await fetch('https://api.resend.com/broadcasts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ segment_id: SEGMENT_ID, from: FROM, reply_to: 'hello@kdp123.com', subject, html, text, name: `kdp123 ${month}` }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(body)}`);
  console.log(`Draft broadcast ${body.id} created. Subject: ${subject}. Review and send it in the Resend dashboard.`);
}
