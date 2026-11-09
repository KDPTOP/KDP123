import type { APIRoute, GetStaticPaths } from 'astro';
import { getFacts, factMarkdown } from '../../lib/facts';

export const getStaticPaths = (async () => {
  const facts = await getFacts();
  return facts.map((f) => ({ params: { slug: f.id }, props: { fact: f } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(factMarkdown(props.fact), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
