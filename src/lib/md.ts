import { priceLabel, isoDate, SITE, type Tool } from './site';
import { categoryBySlug } from './taxonomy';

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
  if (d.platforms.length) lines.push(`- Platforms: ${d.platforms.join(', ')}`);
  lines.push(`- Outputs KDP-ready files: ${yesNo(d.kdp.outputs_kdp_files)}`);
  lines.push(`- Touches your KDP account: ${yesNo(d.kdp.touches_kdp_account)}`);
  if (d.kdp.marketplaces?.length) lines.push(`- Amazon marketplaces: ${d.kdp.marketplaces.join(', ')}`);
  lines.push(`- Official Amazon product: ${yesNo(d.official)}`);
  if (d.related_to_directory) lines.push(`- Disclosure: made by the same team as kdp123`);
  lines.push(`- Last checked: ${isoDate(d.verified_at)}`, '');
  lines.push('## Summary', '', d.summary.trim(), '');
  if (d.pros.length) lines.push('## Pros', '', ...d.pros.map((p) => `- ${p}`), '');
  if (d.cons.length) lines.push('## Cons', '', ...d.cons.map((p) => `- ${p}`), '');
  const alts = d.alternatives.map((a) => byId.get(a)).filter(Boolean) as Tool[];
  if (alts.length) lines.push('## Alternatives', '', ...alts.map((a) => `- [${a.data.name}](${SITE.url}/t/${a.id}/)`), '');
  lines.push('## Sources', '', ...d.sources.map((s) => `- ${s}`), '');
  return lines.join('\n');
}
