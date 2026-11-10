import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';
import { siteItems } from '../lib/feed';

export const GET: APIRoute = async () =>
  rss({
    title: `${SITE.name}: Amazon KDP tools, rules and price changes`,
    description: 'New KDP tool listings, price and plan changes, KDP rule updates, guides and monthly market reports from KDP123.',
    site: SITE.url,
    items: await siteItems(50),
    customData: '<language>en-us</language>',
  });
