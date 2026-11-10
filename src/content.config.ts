import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS, FACT_TOPIC_SLUGS, FIT_LEVELS, FIT_SCOPES } from './lib/taxonomy';

const pricingModels = ['free', 'freemium', 'one-time', 'subscription', 'paid', 'unknown'] as const;
const platforms = ['web', 'windows', 'mac', 'linux', 'chrome-extension', 'firefox-extension', 'ios', 'android'] as const;
const contentTypes = ['low-content', 'puzzle', 'coloring', 'fiction', 'nonfiction', 'children', 'any'] as const;
const fitLevel = z.enum(FIT_LEVELS).default('unverified');

const tools = defineCollection({
  loader: glob({ pattern: '*.yml', base: './data/tools' }),
  schema: z
    .object({
      name: z.string().min(1),
      url: z.url(),
      categories: z.array(z.enum(CATEGORY_SLUGS)).min(1),
      // One sentence, written so it can be quoted on its own: "X is a ... for KDP publishers that ..."
      tagline: z.string().min(20).max(180),
      summary: z.string().min(60),
      official: z.boolean().default(false),
      // Same team as KDP123 (kdptop.com). Shown on the page and held to the same fields and sourcing rules as everything else.
      related_to_directory: z.boolean().default(false),
      pricing: z
        .object({
          model: z.enum(pricingModels),
          from: z.number().nonnegative().optional(),
          currency: z.string().length(3).default('USD'),
          period: z.enum(['one-time', 'week', 'month', 'year']).optional(),
          free_tier: z.boolean().optional(),
          // Lowest price per month when billed yearly, for subscriptions that offer it.
          annual_from: z.number().nonnegative().optional(),
          per: z.enum(['user', 'team', 'book']).optional(),
          trial_days: z.number().int().positive().optional(),
          refund_days: z.number().int().nonnegative().optional(),
          // Prices that differ by country, VAT or currency.
          region_note: z.string().optional(),
          note: z.string().optional(),
        })
        .default({ model: 'unknown', currency: 'USD' }),
      // Dates the price and the feature claims were last read on the vendor's own pages. Both fall back to verified_at.
      price_checked_at: z.coerce.date().optional(),
      features_checked_at: z.coerce.date().optional(),
      // Newest first. Each row is something we saw on the vendor's own page on that date.
      price_history: z
        .array(
          z.object({
            date: z.coerce.date(),
            from: z.number().nonnegative().optional(),
            kind: z.enum(['price', 'plan', 'correction', 'status']).default('price'),
            note: z.string().min(10),
          }),
        )
        .default([]),
      platforms: z.array(z.enum(platforms)).default([]),
      kdp: z
        .object({
          marketplaces: z.array(z.string()).optional(),
          outputs_kdp_files: z.boolean().optional(),
          touches_kdp_account: z.boolean().optional(),
          content_types: z.array(z.enum(contentTypes)).optional(),
        })
        .default({}),
      // Per KDP output. Every level other than unverified needs a vendor page in sources.
      kdp_fit: z
        .object({
          cover: fitLevel,
          interior: fitLevel,
          ebook: fitLevel,
          print: fitLevel,
          // What you still set up yourself, e.g. "Enter trim size, bleed and spine width from KDP's calculator".
          manual_steps: z.array(z.string()).default([]),
          sources: z.array(z.url()).default([]),
          checked_at: z.coerce.date().optional(),
        })
        .default({ cover: 'unverified', interior: 'unverified', ebook: 'unverified', print: 'unverified', manual_steps: [], sources: [] }),
      pros: z.array(z.string()).default([]),
      cons: z.array(z.string()).default([]),
      best_for: z.array(z.string()).default([]),
      not_ideal_for: z.array(z.string()).default([]),
      alternatives: z.array(z.string()).default([]),
      // Disclosure only. The affiliate URL itself lives in the private overlay, never in this repository.
      affiliate: z.boolean().default(false),
      vendor_verified: z.boolean().default(false),
      // draft entries are not built. A published entry needs a human check date and at least one source.
      status: z.enum(['draft', 'published']).default('draft'),
      verified_at: z.coerce.date().optional(),
      sources: z.array(z.url()).default([]),
    })
    .superRefine((t, ctx) => {
      if (t.status === 'published') {
        if (!t.verified_at) ctx.addIssue({ code: 'custom', path: ['verified_at'], message: 'published entries need verified_at' });
        if (t.sources.length === 0) ctx.addIssue({ code: 'custom', path: ['sources'], message: 'published entries need at least one source' });
      }
      const checked = FIT_SCOPES.some((k) => t.kdp_fit[k] !== 'unverified');
      if (checked && (t.kdp_fit.sources.length === 0 || !t.kdp_fit.checked_at))
        ctx.addIssue({ code: 'custom', path: ['kdp_fit'], message: 'kdp_fit levels other than unverified need sources and checked_at' });
    }),
});

// One KDP rule per file, answered first and sourced to Amazon's own pages.
const facts = defineCollection({
  loader: glob({ pattern: '*.md', base: './data/facts' }),
  schema: z
    .object({
      title: z.string().min(10).max(90),
      // Search title when the page title runs past 51 characters (60 with " | KDP123").
      seo_title: z.string().min(10).max(51).optional(),
      // The question people actually ask, phrased as they would type it.
      question: z.string().min(10).max(160),
      // Two or three sentences that answer the question on their own, with the numbers.
      answer: z.string().min(40).max(500),
      topic: z.enum(FACT_TOPIC_SLUGS),
      key_facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
      related_tools: z.array(z.string()).default([]),
      status: z.enum(['draft', 'published']).default('draft'),
      verified_at: z.coerce.date().optional(),
      sources: z.array(z.url()).default([]),
    })
    .superRefine((f, ctx) => {
      if (f.status === 'published') {
        if (!f.verified_at) ctx.addIssue({ code: 'custom', path: ['verified_at'], message: 'published facts need verified_at' });
        if (!f.sources.some((s) => /amazon\.|audible\.|acx\.com/.test(s)))
          ctx.addIssue({ code: 'custom', path: ['sources'], message: 'published facts need at least one Amazon source' });
      }
    }),
});

// "Best X for KDP" pages: stated criteria first, then picks drawn only from published listings, each with its reason.
const best = defineCollection({
  loader: glob({ pattern: '*.yml', base: './data/best' }),
  schema: z.object({
    title: z.string().min(10).max(90),
    seo_title: z.string().min(10).max(51).optional(),
    question: z.string().min(10).max(160),
    // Answer-first summary naming the picks, quotable on its own.
    answer: z.string().min(40).max(600),
    category: z.enum(CATEGORY_SLUGS).optional(),
    criteria: z.array(z.string()).min(2),
    picks: z
      .array(z.object({ tool: z.string(), label: z.string().max(60), why: z.string().min(20) }))
      .min(2),
    not_included: z.array(z.object({ tool: z.string(), why: z.string() })).default([]),
    status: z.enum(['draft', 'published']).default('draft'),
    verified_at: z.coerce.date(),
  }),
});

// Head-to-head pages (/compare/{a}-vs-{b}/). Price, platforms and refund rows come from the two listings; the rows
// here add only what those listings and their sources support.
const compare = defineCollection({
  loader: glob({ pattern: '*.yml', base: './data/compare' }),
  schema: z.object({
    a: z.string(),
    b: z.string(),
    question: z.string().min(10).max(160),
    answer: z.string().min(40).max(600),
    rows: z.array(z.object({ label: z.string(), a: z.string(), b: z.string() })).min(3),
    choose_a: z.string().min(20),
    choose_b: z.string().min(20),
    status: z.enum(['draft', 'published']).default('draft'),
    verified_at: z.coerce.date(),
  }),
});

// One entry per term on /glossary/. The definition stands on its own and every number in it comes from the sources.
const glossary = defineCollection({
  loader: glob({ pattern: '*.md', base: './data/glossary' }),
  schema: z.object({
    term: z.string().min(2).max(60),
    aka: z.array(z.string()).default([]),
    definition: z.string().min(40).max(420),
    facts: z.array(z.string()).default([]),
    tool: z.string().optional(),
    see: z.array(z.string()).default([]),
    sources: z.array(z.url()).min(1),
    status: z.enum(['draft', 'published']).default('draft'),
    verified_at: z.coerce.date(),
  }),
});

// Monthly reports (/reports/YYYY-MM/), frozen by scripts/monthly-report.mjs so a published month never changes.
const reports = defineCollection({
  loader: glob({ pattern: '*.json', base: './data/reports' }),
  schema: z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    period_end: z.coerce.date(),
    generated_at: z.coerce.date(),
    kdptop: z.object({
      source: z.string(),
      license: z.string(),
      url: z.url(),
      snapshot_at: z.coerce.date(),
      data_date: z.coerce.date(),
      tracked_since: z.coerce.date(),
      marketplace: z.string(),
      coverage: z.object({ list_nodes: z.number(), books: z.number(), on_list_24h: z.number(), authors: z.number() }),
      definitions: z.record(z.string(), z.string()),
      top_categories: z.array(
        z.object({
          node_id: z.number(),
          category: z.string(),
          url: z.url().nullable(),
          store: z.enum(['books', 'kindle']),
          opportunity_score: z.number(),
          median_price_usd: z.number().nullable(),
          median_reviews: z.number().nullable(),
          new_release_share: z.number().nullable(),
        }),
      ),
      excluded: z.array(z.object({ category: z.string(), opportunity_score: z.number(), reason: z.string() })).default([]),
    }),
    kdp123: z.object({
      listings: z.number(),
      new_listings: z.array(z.object({ id: z.string(), name: z.string(), categories: z.array(z.string()), added: z.coerce.date() })),
      price_changes: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          date: z.coerce.date(),
          kind: z.enum(['price', 'plan', 'correction', 'status']),
          price_now: z.number().nullable(),
          currency: z.string(),
          note: z.string(),
        }),
      ),
      facts_checked: z.array(z.object({ id: z.string(), title: z.string(), verified_at: z.coerce.date() })),
    }),
  }),
});

// Outside services whose data a KDP123 tool shows. Every call goes through a same-origin proxy on
// kdp123.com that drops cookies and auth headers and rate-limits per IP (deploy/nginx/provider.conf.example).
const providers = defineCollection({
  loader: glob({ pattern: '*.yml', base: './data/providers' }),
  schema: z.object({
    name: z.string(),
    /** The provider's listing in the directory. */
    tool: z.string(),
    same_team: z.boolean().default(false),
    url: z.url(),
    attribution: z.string().min(10),
    link_out: z.url(),
    terms_url: z.url().optional(),
    added_at: z.coerce.date(),
    endpoints: z
      .array(
        z.object({
          path: z.string().startsWith('/api/'),
          upstream: z.string(),
          purpose: z.string(),
          /** What the visitor's browser sends through the proxy. */
          sends: z.string(),
          used_by: z.array(z.string()).min(1),
          limit: z.string(),
        }),
      )
      .min(1),
  }),
});

export const collections = { tools, facts, best, compare, glossary, reports, providers };
