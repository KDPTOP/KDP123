import type { APIRoute } from 'astro';
import { getTools, priceLabel, isoDate, SITE } from '../lib/site';
import { categoryBySlug } from '../lib/taxonomy';
import { getFacts } from '../lib/facts';

const yn = (v?: boolean) => (v === undefined ? 'not stated' : v ? 'yes' : 'no');

export const GET: APIRoute = async () => {
  const tools = await getTools();
  const out: string[] = [`# ${SITE.name}: facts for ${tools.length} listings`, '', `Source: ${SITE.url} (CC BY 4.0). One entry per listing; "checked" is the last human check date.`, ''];
  for (const t of tools) {
    const d = t.data;
    out.push(`## ${d.name}`);
    out.push(`${d.tagline}`);
    out.push(`- page: ${SITE.url}/t/${t.id}/`);
    out.push(`- site: ${d.url}`);
    out.push(`- categories: ${d.categories.map((c) => categoryBySlug(c)?.name).join('; ')}`);
    out.push(`- price: ${priceLabel(t)}${d.pricing.note ? ` (${d.pricing.note})` : ''}`);
    out.push(`- kdp-ready files: ${yn(d.kdp.outputs_kdp_files)}; touches kdp account: ${yn(d.kdp.touches_kdp_account)}`);
    if (d.related_to_directory) out.push('- disclosure: same team as KDP123');
    out.push(`- checked: ${isoDate(d.verified_at)}`, '');
  }
  const facts = await getFacts();
  if (facts.length) out.push('# KDP facts', '');
  for (const f of facts) {
    out.push(`## ${f.data.title}`, `Q: ${f.data.question}`, `A: ${f.data.answer}`);
    for (const k of f.data.key_facts) out.push(`- ${k.label}: ${k.value}`);
    out.push(`- page: ${SITE.url}/facts/${f.id}/`, `- sources: ${f.data.sources.join(' ')}`, `- checked: ${isoDate(f.data.verified_at)}`, '');
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
