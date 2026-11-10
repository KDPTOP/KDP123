import { getTools, isoDate, priceLabel, SITE } from './site';
import { addedDates } from './added';
import { getFacts } from './facts';
import { getBest } from './best';
import { getCompares, compareTitle } from './compare';
import { getReports, monthName } from './reports';
import { categoryBySlug } from './taxonomy';
import changelog from '../../data/changelog.json';

export interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  categories: string[];
}

const abs = (path: string) => new URL(path, SITE.url).toString();
const byDate = (a: FeedItem, b: FeedItem) => b.pubDate.getTime() - a.pubDate.getTime() || a.title.localeCompare(b.title);

/** Price and plan changes from every listing's price_history, newest first. */
export async function changeItems(): Promise<FeedItem[]> {
  return (await getTools())
    .flatMap((t) =>
      t.data.price_history.map((h) => ({
        title: `${t.data.name}: ${h.kind === 'price' ? 'price change' : h.kind === 'plan' ? 'plan change' : h.kind}`,
        link: abs(`/t/${t.id}/#price-${isoDate(h.date)}`),
        description: `${h.note} Current price: ${priceLabel(t)}.`,
        pubDate: h.date,
        categories: ['Price change', ...t.data.categories.map((c) => categoryBySlug(c)?.name ?? c)],
      })),
    )
    .sort(byDate);
}

export async function reportItems(): Promise<FeedItem[]> {
  return (await getReports()).map((r) => ({
    title: `KDP market report, ${monthName(r.data.month)}`,
    link: abs(`/reports/${r.data.month}/`),
    description: `Top Amazon book categories by opportunity, new KDP tool listings and price changes for ${monthName(r.data.month)}, with CSV downloads.`,
    pubDate: r.data.generated_at,
    categories: ['Report'],
  }));
}

/** Everything that changed on the site: new listings, price changes, facts, guides, comparisons, reports and site updates. */
export async function siteItems(limit = 50): Promise<FeedItem[]> {
  const tools = await getTools();
  const added = addedDates();
  const items: FeedItem[] = [
    ...tools.map((t) => ({
      title: `New listing: ${t.data.name}`,
      link: abs(`/t/${t.id}/`),
      description: `${t.data.tagline} ${priceLabel(t)}. Checked ${isoDate(t.data.verified_at)}.`,
      pubDate: added.get(t.id) ?? t.data.verified_at!,
      categories: ['Tool', ...t.data.categories.map((c) => categoryBySlug(c)?.name ?? c)],
    })),
    ...(await changeItems()),
    ...(await getFacts()).map((f) => ({
      title: f.data.title,
      link: abs(`/facts/${f.id}/`),
      description: f.data.answer,
      pubDate: f.data.verified_at!,
      categories: ['KDP fact'],
    })),
    ...(await getBest()).map(({ list }) => ({
      title: list.data.title,
      link: abs(`/best/${list.id}/`),
      description: list.data.answer,
      pubDate: list.data.verified_at,
      categories: ['Guide'],
    })),
    ...(await getCompares()).map(({ cmp, a, b }) => ({
      title: compareTitle(a, b),
      link: abs(`/compare/${cmp.id}/`),
      description: cmp.data.answer,
      pubDate: cmp.data.verified_at,
      categories: ['Comparison'],
    })),
    ...(await reportItems()),
    ...changelog.map((c) => ({
      title: `Site update, ${c.date}`,
      link: abs(`/changelog/#${c.date}`),
      description: c.note,
      pubDate: new Date(`${c.date}T00:00:00Z`),
      categories: ['Site update'],
    })),
  ];
  return items.sort(byDate).slice(0, limit);
}
