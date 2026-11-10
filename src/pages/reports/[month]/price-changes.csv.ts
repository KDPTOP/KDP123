import type { APIRoute } from 'astro';
import { getReports, csv, type Report } from '../../../lib/reports';
import { SITE } from '../../../lib/site';

export async function getStaticPaths() {
  return (await getReports()).map((r) => ({ params: { month: r.data.month }, props: { report: r } }));
}

export const GET: APIRoute = ({ props }) => {
  const { kdp123 } = (props as { report: Report }).report.data;
  return csv(
    ['date', 'tool_id', 'tool', 'kind', 'price_now', 'currency', 'note', 'page'],
    kdp123.price_changes.map((c) => [
      c.date.toISOString().slice(0, 10), c.id, c.name, c.kind, c.price_now, c.currency, c.note, `${SITE.url}/t/${c.id}/`,
    ]),
  );
};
