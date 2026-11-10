import type { APIRoute } from 'astro';
import { getTools, outbound, priceLabel, logoSrc } from '../lib/site';
import { categoryBySlug, CATEGORIES, STAGES } from '../lib/taxonomy';
import { getFacts } from '../lib/facts';
import { getBest } from '../lib/best';
import { getCompares, compareTitle } from '../lib/compare';

// Compact index for the command box: directory tools (with their outbound link), KDP facts and guides.
// Calculators are bundled with the script itself, so they work before this file loads.
export const GET: APIRoute = async () => {
  const tools = (await getTools()).map((t) => {
    const out = outbound(t);
    return {
      id: t.id,
      n: t.data.name,
      d: t.data.tagline.replace(/\s+/g, ' ').trim().slice(0, 110),
      p: priceLabel(t),
      c: t.data.categories.map((c) => categoryBySlug(c)?.name ?? c).join(', '),
      h: out.href,
      r: out.rel,
      l: logoSrc(t.id),
    };
  });
  const pages = [
    ...CATEGORIES.map((c) => ({ n: `${c.name} tools`, u: `/c/${c.slug}/`, k: 'Category' })),
    ...STAGES.map((st) => ({ n: `${st.name}: tools by stage`, u: `/stages/${st.slug}/`, k: 'Stage' })),
    ...(await getFacts()).map((f) => ({ n: f.data.title, u: `/facts/${f.id}/`, k: 'KDP fact' })),
    ...(await getBest()).map(({ list }) => ({ n: list.data.title, u: `/best/${list.id}/`, k: 'Guide' })),
    ...(await getCompares()).map(({ cmp, a, b }) => ({ n: compareTitle(a, b), u: `/compare/${cmp.id}/`, k: 'Comparison' })),
  ];
  return new Response(JSON.stringify({ tools, pages }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
