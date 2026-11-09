import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://kdp123.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // /go/ redirects and the 404 page are not content.
      filter: (page) => !page.includes('/go/'),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
