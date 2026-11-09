import { getCollection, type CollectionEntry } from 'astro:content';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SITE = {
  name: 'kdp123',
  url: 'https://kdp123.com',
  tagline: 'The reference directory for Amazon KDP publishers',
  description:
    'Verified tools, official rules and open data for Amazon KDP publishers. Every listing shows what it costs, what it does for KDP, and when we last checked.',
  github: 'https://github.com/KDPTOP/KDP123',
  related: { name: 'KDPTop', url: 'https://kdptop.com' },
};

export type Tool = CollectionEntry<'tools'>;

export async function getTools(): Promise<Tool[]> {
  const all = await getCollection('tools', (t) => t.data.status === 'published');
  return all.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export const isoDate = (d?: Date) => (d ? d.toISOString().slice(0, 10) : undefined);

const PLATFORM_LABELS: Record<string, string> = {
  web: 'Web',
  windows: 'Windows',
  mac: 'Mac',
  linux: 'Linux',
  'chrome-extension': 'Chrome extension',
  'firefox-extension': 'Firefox extension',
  ios: 'iOS',
  android: 'Android',
};

export function platformsLabel(t: Tool): string {
  return t.data.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(', ');
}

export function priceLabel(t: Tool): string {
  const p = t.data.pricing;
  const per = { 'one-time': ' one-time', week: '/wk', month: '/mo', year: '/yr' } as const;
  const money = p.from !== undefined ? `${p.currency === 'USD' ? '$' : p.currency + ' '}${p.from}` : '';
  switch (p.model) {
    case 'free':
      return 'Free';
    case 'freemium':
      return money ? `Free tier, paid from ${money}${p.period ? per[p.period] : ''}` : 'Free tier';
    case 'one-time':
      return money ? `${money} one-time` : 'One-time';
    case 'subscription':
      return money ? `From ${money}${p.period ? per[p.period] : '/mo'}` : 'Subscription';
    case 'paid':
      return money ? `From ${money}` : 'Paid';
    default:
      return 'See site';
  }
}

export const PRICE_FILTERS = [
  { value: 'free', label: 'Free', models: ['free'] },
  { value: 'freemium', label: 'Free tier', models: ['freemium'] },
  { value: 'one-time', label: 'One-time', models: ['one-time'] },
  { value: 'subscription', label: 'Subscription', models: ['subscription'] },
] as const;

// Affiliate overlay. The repository never contains affiliate URLs: they live in an untracked
// affiliates.private.json ({ "slug": "https://..." }) that exists only on the build machine.
let overlay: Record<string, string> | undefined;
function affiliateUrls(): Record<string, string> {
  if (overlay) return overlay;
  const file = join(process.cwd(), 'affiliates.private.json');
  overlay = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>) : {};
  return overlay;
}

export function affiliateUrl(slug: string): string | undefined {
  return affiliateUrls()[slug];
}

/** Outbound link for a tool. Uses the /go/ redirect only when a private affiliate URL exists. */
export function outbound(t: Tool): { href: string; rel: string } {
  if (affiliateUrl(t.id)) return { href: `/go/${t.id}/`, rel: 'sponsored nofollow noopener' };
  return { href: t.data.url, rel: 'noopener' };
}
