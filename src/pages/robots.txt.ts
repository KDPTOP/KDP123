import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

// Search and AI-answer crawlers are welcome. /go/ is outbound redirects only; /drawer/ holds calculator fragments.
export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /go/',
      'Disallow: /drawer/',
      '',
      `Sitemap: ${SITE.url}/sitemap-index.xml`,
      '',
      `# Feeds: ${SITE.url}/rss.xml (all updates), ${SITE.url}/changes/rss.xml (price changes),`,
      `# ${SITE.url}/reports/rss.xml (monthly reports), ${SITE.url}/feed.json (JSON Feed). Data: ${SITE.url}/tools.json`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
