import type { APIRoute, GetStaticPaths } from 'astro';
import { getBest, bestMarkdown } from '../../lib/best';

export const getStaticPaths = (async () =>
  (await getBest()).map(({ list, tools }) => ({ params: { slug: list.id }, props: { list, byId: new Map(tools.map((t) => [t.id, t])) } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(bestMarkdown(props.list, props.byId), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
