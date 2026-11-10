import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../../lib/site';
import { reportItems } from '../../lib/feed';

export const GET: APIRoute = async () =>
  rss({
    title: `${SITE.name}: monthly KDP market reports`,
    description: 'Monthly Amazon KDP market reports: top book categories by opportunity, new tools and price changes, with CSV downloads.',
    site: SITE.url,
    items: await reportItems(),
    customData: '<language>en-us</language>',
  });
