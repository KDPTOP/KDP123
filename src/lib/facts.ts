import { getCollection, type CollectionEntry } from 'astro:content';
import { FACT_TOPICS } from './taxonomy';
import { SITE, isoDate } from './site';

export type Fact = CollectionEntry<'facts'>;

export async function getFacts(): Promise<Fact[]> {
  const all = await getCollection('facts', (f) => f.data.status === 'published');
  const order = (f: Fact) => FACT_TOPICS.findIndex((t) => t.slug === f.data.topic);
  return all.sort((a, b) => order(a) - order(b) || a.data.title.localeCompare(b.data.title));
}

export const topicName = (slug: string) => FACT_TOPICS.find((t) => t.slug === slug)?.name ?? slug;

export function factMarkdown(f: Fact): string {
  const d = f.data;
  const out = [`# ${d.title}`, '', `> ${d.question}`, '', d.answer, ''];
  if (d.key_facts.length) {
    out.push('| Fact | Value |', '| --- | --- |');
    for (const k of d.key_facts) out.push(`| ${k.label} | ${k.value} |`);
    out.push('');
  }
  if (f.body) out.push(f.body.trim(), '');
  if (d.faq.length) {
    out.push('## FAQ', '');
    for (const q of d.faq) out.push(`**${q.q}**`, '', q.a, '');
  }
  out.push('## Sources', '', ...d.sources.map((s) => `- ${s}`), '');
  out.push(`Last checked: ${isoDate(d.verified_at)}. Page: ${SITE.url}/facts/${f.id}/. Data: CC BY 4.0, kdp123.com.`, '');
  return out.join('\n');
}
