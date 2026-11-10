import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';
import { siteItems } from '../lib/feed';

// JSON Feed 1.1 (https://jsonfeed.org/version/1.1): the same items as /rss.xml.
export const GET: APIRoute = async () => {
  const items = await siteItems(50);
  const body = {
    version: 'https://jsonfeed.org/version/1.1',
    title: `${SITE.name}: Amazon KDP tools, rules and price changes`,
    home_page_url: `${SITE.url}/`,
    feed_url: `${SITE.url}/feed.json`,
    description: 'New KDP tool listings, price and plan changes, KDP rule updates, guides and monthly market reports.',
    icon: `${SITE.url}/icon-512.png`,
    favicon: `${SITE.url}/favicon-48.png`,
    language: 'en-US',
    authors: [{ name: SITE.name, url: `${SITE.url}/` }],
    items: items.map((i) => ({
      id: `${i.link}#${i.pubDate.toISOString().slice(0, 10)}-${i.categories[0].toLowerCase().replace(/\s+/g, '-')}`,
      url: i.link,
      title: i.title,
      content_text: i.description,
      date_published: i.pubDate.toISOString(),
      tags: i.categories,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
