import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { lastmodMap } from './scripts/lastmod.mjs';

const lastmod = lastmodMap();
const pathOf = (url) => new URL(url).pathname;
// Exact page first, then the section it belongs to (/stages/x/ uses /stages/, /free-tools/x/ uses /free-tools/).
const lastmodFor = (path) => lastmod.get(path) ?? lastmod.get(`/${path.split('/')[1]}/`);
const section = (prefixes) => (item) => (prefixes.some((p) => pathOf(item.url).startsWith(p)) ? item : undefined);

export default defineConfig({
  site: 'https://kdp123.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // /go/ redirects, drawer fragments, search results, the compare picker and the 404 page are not content.
      filter: (page) => !page.includes('/go/') && !page.includes('/drawer/') && !page.endsWith('/search/') && !page.endsWith('/compare/pick/'),
      // One sitemap per content type, so Search Console reports indexing for each separately. The rest go to sitemap-pages.
      chunks: {
        tools: section(['/t/', '/c/', '/stages/', '/tools/']),
        facts: section(['/facts/', '/glossary/', '/free-tools/']),
        guides: section(['/best/', '/compare/']),
        reports: section(['/reports/', '/research/', '/changes/']),
      },
      serialize: (item) => {
        const d = lastmodFor(pathOf(item.url));
        return d ? { ...item, lastmod: d } : item;
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
