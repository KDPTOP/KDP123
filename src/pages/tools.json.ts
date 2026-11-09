import type { APIRoute } from 'astro';
import { getTools, isoDate, SITE } from '../lib/site';

export const GET: APIRoute = async () => {
  const tools = await getTools();
  const body = {
    name: 'kdp123 tools directory',
    license: 'CC BY 4.0 - attribute "kdp123.com" with a link',
    source: SITE.url,
    repository: SITE.github,
    count: tools.length,
    tools: tools.map((t) => ({
      id: t.id,
      name: t.data.name,
      url: t.data.url,
      page: `${SITE.url}/t/${t.id}/`,
      categories: t.data.categories,
      tagline: t.data.tagline,
      official: t.data.official,
      related_to_directory: t.data.related_to_directory,
      pricing: t.data.pricing,
      platforms: t.data.platforms,
      kdp: t.data.kdp,
      alternatives: t.data.alternatives,
      vendor_verified: t.data.vendor_verified,
      verified_at: isoDate(t.data.verified_at),
      sources: t.data.sources,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
