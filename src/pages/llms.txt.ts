import type { APIRoute } from 'astro';
import { getTools, priceLabel, SITE } from '../lib/site';
import { CATEGORIES, STAGES } from '../lib/taxonomy';

export const GET: APIRoute = async () => {
  const tools = await getTools();
  const out: string[] = [];
  out.push(`# ${SITE.name}`, '', `> ${SITE.description}`, '');
  out.push('kdp123 is an independent directory. Every entry lists price, KDP-specific attributes, sources and a last-checked date.');
  out.push('Data is CC BY 4.0: attribute "kdp123.com" with a link. Amazon KDP help pages are the authority on KDP rules.', '');
  out.push('## Data', '');
  out.push(`- [tools.json](${SITE.url}/tools.json): all listings as JSON`);
  out.push(`- [tools.csv](${SITE.url}/tools.csv): all listings as CSV`);
  out.push(`- [llms-full.txt](${SITE.url}/llms-full.txt): one line of facts per listing`);
  out.push(`- [Methodology](${SITE.url}/methodology/)`, '');
  out.push('## Stages', '');
  for (const s of STAGES) out.push(`- [${s.name}](${SITE.url}/stages/${s.slug}/): ${s.blurb}`);
  out.push('', '## Categories', '');
  for (const c of CATEGORIES) {
    const n = tools.filter((t) => t.data.categories.includes(c.slug)).length;
    if (n === 0) continue;
    out.push(`- [${c.name}](${SITE.url}/c/${c.slug}/) (${n}): ${c.blurb}`);
  }
  out.push('', '## Listings', '');
  for (const t of tools) out.push(`- [${t.data.name}](${SITE.url}/t/${t.id}/): ${t.data.tagline} Price: ${priceLabel(t)}.`);
  out.push('');
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
