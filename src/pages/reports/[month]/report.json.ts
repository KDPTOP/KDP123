import type { APIRoute } from 'astro';
import { getReports, type Report } from '../../../lib/reports';

export async function getStaticPaths() {
  return (await getReports()).map((r) => ({ params: { month: r.data.month }, props: { report: r } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify({ license: 'CC BY 4.0', ...(props as { report: Report }).report.data }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
