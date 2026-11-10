import { getCollection, type CollectionEntry } from 'astro:content';

export type Report = CollectionEntry<'reports'>;

/** Newest month first. */
export async function getReports(): Promise<Report[]> {
  return (await getCollection('reports')).sort((a, b) => b.data.month.localeCompare(a.data.month));
}

export function monthName(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** True while the month is still running when the report was frozen. */
export function isPartial(r: Report): boolean {
  const [y, m] = r.data.month.split('-').map(Number);
  return r.data.period_end < new Date(Date.UTC(y, m, 0));
}

const esc = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function csv(head: string[], rows: unknown[][]): Response {
  return new Response([head.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n') + '\n', {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
}
