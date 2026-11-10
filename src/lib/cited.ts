import { getTools } from './site';
import { getBest } from './best';
import { getCompares } from './compare';

/** How many of our shortlist picks, comparisons and other listings' alternatives name each tool. Used to order the home page grid. */
export async function citationCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const add = (id: string) => counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const { list } of await getBest()) list.data.picks.forEach((p) => add(p.tool));
  for (const { a, b } of await getCompares()) [a.id, b.id].forEach(add);
  for (const t of await getTools()) t.data.alternatives.forEach(add);
  return counts;
}
