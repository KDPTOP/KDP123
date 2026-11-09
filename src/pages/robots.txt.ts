import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

// Search and AI-answer crawlers are welcome. /go/ is outbound redirects only.
export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /go/',
      '',
      `Sitemap: ${SITE.url}/sitemap-index.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
