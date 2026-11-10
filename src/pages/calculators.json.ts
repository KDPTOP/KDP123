import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';
import { FREE_TOOLS, TOOL_GROUPS } from '../lib/freeTools';
import { getFacts } from '../lib/facts';

export const GET: APIRoute = async () => {
  const facts = await getFacts();
  const body = {
    name: 'KDP123 free calculators',
    license: 'CC BY 4.0 - attribute "kdp123.com" with a link',
    source: `${SITE.url}/free-tools/`,
    repository: SITE.github,
    note: 'Formulas use the KDP rules on the linked fact pages. Add the params to the page URL to open a filled-in result. Calculations run in the browser.',
    groups: TOOL_GROUPS,
    count: FREE_TOOLS.length,
    calculators: FREE_TOOLS.map((t) => ({
      slug: t.slug,
      name: t.name,
      group: t.group,
      url: `${SITE.url}/free-tools/${t.slug}/`,
      description: t.blurb,
      formula: t.formula,
      params: t.params,
      data_provider: t.provider ?? null,
      facts: t.facts.map((id) => {
        const f = facts.find((x) => x.id === id);
        return { id, url: `${SITE.url}/facts/${id}/`, question: f?.data.question, sources: f?.data.sources ?? [] };
      }),
    })),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
