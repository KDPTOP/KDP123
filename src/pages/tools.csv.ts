import type { APIRoute } from 'astro';
import { getTools, isoDate, SITE } from '../lib/site';

const esc = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const GET: APIRoute = async () => {
  const tools = await getTools();
  const head = [
    'id', 'name', 'url', 'page', 'categories', 'official', 'related_to_directory', 'pricing_model', 'price_from', 'currency',
    'price_period', 'free_tier', 'refund_days', 'platforms', 'outputs_kdp_files', 'touches_kdp_account', 'verified_at',
  ];
  const rows = tools.map((t) => {
    const d = t.data;
    return [
      t.id, d.name, d.url, `${SITE.url}/t/${t.id}/`, d.categories.join('|'), d.official, d.related_to_directory,
      d.pricing.model, d.pricing.from, d.pricing.currency, d.pricing.period, d.pricing.free_tier, d.pricing.refund_days,
      d.platforms.join('|'), d.kdp.outputs_kdp_files, d.kdp.touches_kdp_account, isoDate(d.verified_at),
    ].map(esc).join(',');
  });
  return new Response([head.join(','), ...rows].join('\n') + '\n', {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
