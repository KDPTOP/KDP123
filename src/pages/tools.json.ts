import type { APIRoute } from 'astro';
import { getTools, isoDate, priceLabel, priceTerms, platformsLabel, checkDates, logoSrc, SITE } from '../lib/site';
import { categoryBySlug } from '../lib/taxonomy';

export const GET: APIRoute = async () => {
  const tools = await getTools();
  const body = {
    name: 'KDP123 tools directory',
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
      price_label: priceLabel(t),
      price_terms: priceTerms(t),
      platforms_label: platformsLabel(t),
      category_names: t.data.categories.map((c) => categoryBySlug(c)?.name ?? c),
      platforms: t.data.platforms,
      kdp: t.data.kdp,
      kdp_fit: { ...t.data.kdp_fit, checked_at: isoDate(t.data.kdp_fit.checked_at) },
      best_for: t.data.best_for,
      not_ideal_for: t.data.not_ideal_for,
      cons: t.data.cons,
      logo: logoSrc(t.id) ? `${SITE.url}${logoSrc(t.id)}` : undefined,
      alternatives: t.data.alternatives,
      vendor_verified: t.data.vendor_verified,
      verified_at: isoDate(t.data.verified_at),
      checked: checkDates(t),
      sources: t.data.sources,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
