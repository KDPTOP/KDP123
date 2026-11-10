import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../../lib/site';
import { changeItems } from '../../lib/feed';

export const GET: APIRoute = async () =>
  rss({
    title: `${SITE.name}: KDP tool price and plan changes`,
    description: 'Price and plan changes for Amazon KDP tools, each read on the vendor’s own pricing page.',
    site: SITE.url,
    items: (await changeItems()).slice(0, 100),
    customData: '<language>en-us</language>',
  });
