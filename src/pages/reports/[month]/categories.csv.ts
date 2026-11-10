import type { APIRoute } from 'astro';
import { getReports, csv, type Report } from '../../../lib/reports';

export async function getStaticPaths() {
  return (await getReports()).map((r) => ({ params: { month: r.data.month }, props: { report: r } }));
}

export const GET: APIRoute = ({ props }) => {
  const { kdptop } = (props as { report: Report }).report.data;
  return csv(
    ['rank', 'node_id', 'category', 'store', 'opportunity_score', 'median_price_usd', 'median_reviews', 'new_release_share', 'kdptop_url', 'data_date'],
    kdptop.top_categories.map((c, i) => [
      i + 1, c.node_id, c.category, c.store, c.opportunity_score, c.median_price_usd, c.median_reviews, c.new_release_share, c.url,
      kdptop.data_date.toISOString().slice(0, 10),
    ]),
  );
};
