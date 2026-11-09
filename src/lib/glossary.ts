import { getCollection, type CollectionEntry } from 'astro:content';
import { freeTool } from './freeTools';

export type Term = CollectionEntry<'glossary'>;

/** Published terms sorted A-Z; links to unknown facts, terms or free tools fail the build. */
export async function getTerms(): Promise<Term[]> {
  const terms = (await getCollection('glossary', (g) => g.data.status === 'published')).sort((a, b) =>
    a.data.term.localeCompare(b.data.term, 'en', { sensitivity: 'base' }),
  );
  const facts = new Set((await getCollection('facts', (f) => f.data.status === 'published')).map((f) => f.id));
  const ids = new Set(terms.map((t) => t.id));
  for (const t of terms) {
    for (const f of t.data.facts) if (!facts.has(f)) throw new Error(`glossary/${t.id}: unknown fact ${f}`);
    for (const s of t.data.see) if (!ids.has(s)) throw new Error(`glossary/${t.id}: unknown term ${s}`);
    if (t.data.tool && !freeTool(t.data.tool)) throw new Error(`glossary/${t.id}: unknown free tool ${t.data.tool}`);
  }
  return terms;
}

export const termUrl = (id: string) => `/glossary/#${id}`;

export async function termsForFact(factId: string): Promise<Term[]> {
  return (await getTerms()).filter((t) => t.data.facts.includes(factId));
}
