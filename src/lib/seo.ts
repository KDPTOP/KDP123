import { SITE } from './site';

export const TITLE_MAX = 60;
export const DESC_MAX = 158;

/** First variant that fits with the brand suffix, then the first that fits alone, then the shortest. */
export function fitTitle(variants: string[], brand = SITE.name): string {
  const clean = variants.map((v) => v.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (const v of clean) if (`${v} | ${brand}`.length <= TITLE_MAX) return `${v} | ${brand}`;
  for (const v of clean) if (v.length <= TITLE_MAX) return v;
  return clean.reduce((a, b) => (b.length < a.length ? b : a));
}

/** Collapse whitespace and cut at a word boundary so the description is at most DESC_MAX characters. */
export function clampDescription(text: string, max = DESC_MAX): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const at = cut.lastIndexOf(' ');
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.(-]+$/, '')}…`;
}

/** Path of the generated social image for a page path, e.g. /t/canva/ -> /og/t/canva.png. */
export function ogImagePath(pathname: string): string {
  const p = pathname.replace(/^\/+|\/+$/g, '');
  return `/og/${p && p !== '404' ? p : 'index'}.png`;
}

export interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: new URL(c.url, SITE.url).toString() })),
  };
}

export const ORG_ID = `${SITE.url}/#organization`;
export const SITE_ID = `${SITE.url}/#website`;

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE.name,
  url: `${SITE.url}/`,
  logo: { '@type': 'ImageObject', url: `${SITE.url}/icon-512.png`, width: 512, height: 512 },
  email: 'hello@kdp123.com',
  sameAs: [SITE.github],
  description: SITE.description,
};

export const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: SITE.name,
  url: `${SITE.url}/`,
  description: SITE.description,
  inLanguage: 'en',
  publisher: { '@id': ORG_ID },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/search/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export const publisherRef = { '@type': 'Organization', '@id': ORG_ID, name: SITE.name, url: `${SITE.url}/` };
