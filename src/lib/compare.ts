import { getCollection, type CollectionEntry } from 'astro:content';
import { getTools, type Tool } from './site';

export type Compare = CollectionEntry<'compare'>;

/** Published comparisons with both sides resolved to published listings; a missing side fails the build. */
export async function getCompares(): Promise<{ cmp: Compare; a: Tool; b: Tool }[]> {
  const all = await getCollection('compare', (c) => c.data.status === 'published');
  const byId = new Map((await getTools()).map((t) => [t.id, t]));
  return all
    .sort((x, y) => x.id.localeCompare(y.id))
    .map((cmp) => {
      const a = byId.get(cmp.data.a);
      const b = byId.get(cmp.data.b);
      if (!a || !b) throw new Error(`compare/${cmp.id}: both sides must be published listings`);
      if (cmp.id !== `${cmp.data.a}-vs-${cmp.data.b}`) throw new Error(`compare/${cmp.id}: file must be named ${cmp.data.a}-vs-${cmp.data.b}.yml`);
      return { cmp, a, b };
    });
}

export const compareTitle = (a: Tool, b: Tool) => `${a.data.name} vs ${b.data.name}`;
