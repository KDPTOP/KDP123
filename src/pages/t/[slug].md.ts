import type { APIRoute, GetStaticPaths } from 'astro';
import { getTools } from '../../lib/site';
import { toolMarkdown } from '../../lib/md';

export const getStaticPaths = (async () => {
  const tools = await getTools();
  const byId = new Map(tools.map((t) => [t.id, t]));
  return tools.map((t) => ({ params: { slug: t.id }, props: { tool: t, byId } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(toolMarkdown(props.tool, props.byId), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
