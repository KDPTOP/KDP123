import { priceLabel, priceTerms, checkDates, isoDate, SITE, type Tool } from './site';
import { categoryBySlug, FIT_SCOPES, FIT_SCOPE_INFO, FIT_LEVEL_INFO } from './taxonomy';

const yesNo = (v?: boolean) => (v === undefined ? 'Not stated' : v ? 'Yes' : 'No');

/** Plain-markdown version of a tool page, served at /t/{slug}.md for agents and low-token fetching. */
export function toolMarkdown(t: Tool, byId: Map<string, Tool>): string {
  const d = t.data;
  const lines: string[] = [];
  lines.push(`# ${d.name}`, '', d.tagline, '');
  lines.push(`- Canonical page: ${SITE.url}/t/${t.id}/`);
  lines.push(`- Official site: ${d.url}`);
  lines.push(`- Categories: ${d.categories.map((c) => categoryBySlug(c)?.name).join(', ')}`);
  lines.push(`- Price: ${priceLabel(t)}${d.pricing.note ? ` (${d.pricing.note})` : ''}`);
  for (const term of priceTerms(t)) lines.push(`- Price terms: ${term}`);
  if (d.platforms.length) lines.push(`- Platforms: ${d.platforms.join(', ')}`);
  lines.push(`- Outputs KDP-ready files: ${yesNo(d.kdp.outputs_kdp_files)}`);
  lines.push(`- Touches your KDP account: ${yesNo(d.kdp.touches_kdp_account)}`);
  if (d.kdp.marketplaces?.length) lines.push(`- Amazon marketplaces: ${d.kdp.marketplaces.join(', ')}`);
  lines.push(`- Official Amazon product: ${yesNo(d.official)}`);
  if (d.related_to_directory) lines.push(`- Disclosure: made by the same team as KDP123`);
  const dates = checkDates(t);
  lines.push(`- Price checked: ${dates.price}`, `- Features checked: ${dates.features}`);
  if (dates.link) lines.push(`- Link checked: ${dates.link}`);
  lines.push('');
  if (d.best_for.length) lines.push('## Best for', '', ...d.best_for.map((x) => `- ${x}`), '');
  if (d.not_ideal_for.length) lines.push('## Not ideal for', '', ...d.not_ideal_for.map((x) => `- ${x}`), '');
  if (FIT_SCOPES.some((k) => d.kdp_fit[k] !== 'unverified')) {
    lines.push('## KDP fit', '', ...FIT_SCOPES.map((k) => `- ${FIT_SCOPE_INFO[k].name}: ${FIT_LEVEL_INFO[d.kdp_fit[k]].label}`));
    for (const m of d.kdp_fit.manual_steps) lines.push(`- Set up yourself: ${m}`);
    lines.push(`- Checked ${isoDate(d.kdp_fit.checked_at)}: ${d.kdp_fit.sources.join(', ')}`, '');
  }
  lines.push('## Summary', '', d.summary.trim(), '');
  if (d.price_history.length)
    lines.push('## Price history', '', ...d.price_history.map((h) => `- ${isoDate(h.date)}: ${h.note}`), '');
  if (d.pros.length) lines.push('## Pros', '', ...d.pros.map((p) => `- ${p}`), '');
  if (d.cons.length) lines.push('## Cons', '', ...d.cons.map((p) => `- ${p}`), '');
  const alts = d.alternatives.map((a) => byId.get(a)).filter(Boolean) as Tool[];
  if (alts.length) lines.push('## Alternatives', '', ...alts.map((a) => `- [${a.data.name}](${SITE.url}/t/${a.id}/)`), '');
  lines.push('## Sources', '', ...d.sources.map((s) => `- ${s}`), '');
  return lines.join('\n');
}
