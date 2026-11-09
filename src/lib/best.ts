import { getCollection, type CollectionEntry } from 'astro:content';
import { getTools, priceLabel, isoDate, SITE, type Tool } from './site';

export type Best = CollectionEntry<'best'>;

/** Published lists, with every pick resolved to a published tool. A pick that is missing or a draft fails the build. */
export async function getBest(): Promise<{ list: Best; tools: Tool[] }[]> {
  const lists = await getCollection('best', (b) => b.data.status === 'published');
  const byId = new Map((await getTools()).map((t) => [t.id, t]));
  return lists
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .map((list) => {
      const ids = [...list.data.picks.map((p) => p.tool), ...list.data.not_included.map((n) => n.tool)];
      const missing = ids.filter((id) => !byId.has(id));
      if (missing.length) throw new Error(`best/${list.id}: not a published listing: ${missing.join(', ')}`);
      return { list, tools: ids.map((id) => byId.get(id)!) };
    });
}

export function bestMarkdown(list: Best, byId: Map<string, Tool>): string {
  const d = list.data;
  const out = [`# ${d.title}`, '', `> ${d.question}`, '', d.answer, '', '## How we chose', '', ...d.criteria.map((c) => `- ${c}`), '', '## Picks', ''];
  d.picks.forEach((p, i) => {
    const t = byId.get(p.tool)!;
    out.push(`${i + 1}. **${t.data.name}** (${p.label}). ${p.why} Price: ${priceLabel(t)}. ${SITE.url}/t/${t.id}/`);
  });
  if (d.not_included.length) {
    out.push('', '## Considered, not picked', '');
    for (const n of d.not_included) out.push(`- ${byId.get(n.tool)!.data.name}: ${n.why}`);
  }
  out.push('', `Last reviewed: ${isoDate(d.verified_at)}. Page: ${SITE.url}/best/${list.id}/. No vendor paid to be listed.`, '');
  return out.join('\n');
}
