import type { APIRoute } from 'astro';
import { getTerms } from '../lib/glossary';
import { SITE } from '../lib/site';

export const GET: APIRoute = async () => {
  const terms = await getTerms();
  const out = [`# KDP glossary`, '', `Source: ${SITE.url}/glossary/ · License: CC BY 4.0`, ''];
  for (const t of terms) {
    out.push(`## ${t.data.term}`, '');
    if (t.data.aka.length) out.push(`Also: ${t.data.aka.join(', ')}`, '');
    out.push(t.data.definition, '');
    for (const f of t.data.facts) out.push(`- Rules: ${SITE.url}/facts/${f}/`);
    for (const s of t.data.sources) out.push(`- Source: ${s}`);
    out.push('');
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
