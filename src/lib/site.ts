import { getCollection, type CollectionEntry } from 'astro:content';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SITE = {
  name: 'KDP123',
  url: 'https://kdp123.com',
  tagline: 'Amazon KDP tools, rules and resources, checked and compared',
  description:
    'Find the right Amazon KDP tools for your next book: self-publishing tools, official KDP rules and free calculators, each with its price, KDP fit and check date.',
  github: 'https://github.com/KDPTOP/KDP123',
  related: { name: 'KDPTop', url: 'https://kdptop.com' },
};

export type Tool = CollectionEntry<'tools'>;

export async function getTools(): Promise<Tool[]> {
  const all = await getCollection('tools', (t) => t.data.status === 'published');
  return all.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export function logoSrc(id: string): string | undefined {
  return existsSync(join(process.cwd(), 'public/logos', `${id}.png`)) ? `/logos/${id}.png` : undefined;
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

/** priceLabel for tight spots (cards, compact tables): "Free tier, from $9/mo". */
export const priceShort = (t: Tool): string => priceLabel(t).replace('Free tier, paid from', 'Free tier, from');

/** The price terms beyond the headline: yearly billing, unit, trial, refund and regional differences. */
export function priceTerms(t: Tool): string[] {
  const p = t.data.pricing;
  const sym = p.currency === 'USD' ? '$' : p.currency + ' ';
  const out: string[] = [];
  if (p.annual_from !== undefined) out.push(`${sym}${p.annual_from}/mo billed yearly`);
  if (p.per) out.push(`Priced per ${p.per}`);
  if (p.trial_days) out.push(`${p.trial_days}-day free trial`);
  if (p.refund_days !== undefined) out.push(p.refund_days ? `${p.refund_days}-day refund window` : 'No refunds');
  if (p.region_note) out.push(p.region_note.replace(/\.$/, ''));
  return out;
}

let linkLedger: Record<string, { ok: boolean; checked_at?: string; failed_at?: string }> | undefined;
/** Last date the listing URL answered, from data/link-check.json (written by npm run links). */
export function linkCheck(id: string) {
  if (!linkLedger) {
    const file = join(process.cwd(), 'data/link-check.json');
    linkLedger = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  }
  return linkLedger![id];
}

export function checkDates(t: Tool) {
  const d = t.data;
  return {
    price: isoDate(d.price_checked_at ?? d.verified_at),
    features: isoDate(d.features_checked_at ?? d.verified_at),
    link: linkCheck(t.id)?.checked_at,
  };
}

export const PRICE_FILTERS = [
  { value: 'free', label: 'Free', models: ['free'], hint: 'Free to use in full; there is no paid plan' },
  { value: 'freemium', label: 'Free tier', models: ['freemium'], hint: 'A limited free plan next to paid plans' },
  { value: 'one-time', label: 'One-time', models: ['one-time'], hint: 'Pay once, keep using it' },
  { value: 'subscription', label: 'Subscription', models: ['subscription'], hint: 'Billed weekly, monthly or yearly' },
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

/** Meta description for a listing: price first, then what it does, then the check date when it fits. */
export function toolDescription(t: Tool): string {
  const d = t.data;
  const base = `${d.name}: ${priceLabel(t)}. ${d.tagline.replace(/\s+/g, ' ').trim()}`;
  const tail = ` Checked ${isoDate(d.verified_at)}, with KDP fit and alternatives.`;
  return base.length + tail.length <= 158 ? base + tail : base;
}
