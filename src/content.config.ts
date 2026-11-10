import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS, FACT_TOPIC_SLUGS } from './lib/taxonomy';

const pricingModels = ['free', 'freemium', 'one-time', 'subscription', 'paid', 'unknown'] as const;
const platforms = ['web', 'windows', 'mac', 'linux', 'chrome-extension', 'firefox-extension', 'ios', 'android'] as const;
const contentTypes = ['low-content', 'puzzle', 'coloring', 'fiction', 'nonfiction', 'children', 'any'] as const;

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
      // Same team as kdp123 (kdptop.com). Shown on the page and held to the same fields and sourcing rules as everything else.
      related_to_directory: z.boolean().default(false),
      pricing: z
        .object({
          model: z.enum(pricingModels),
          from: z.number().nonnegative().optional(),
          currency: z.string().length(3).default('USD'),
          period: z.enum(['one-time', 'week', 'month', 'year']).optional(),
          free_tier: z.boolean().optional(),
          refund_days: z.number().int().nonnegative().optional(),
          note: z.string().optional(),
        })
        .default({ model: 'unknown', currency: 'USD' }),
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
      pros: z.array(z.string()).default([]),
      cons: z.array(z.string()).default([]),
      best_for: z.array(z.string()).default([]),
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
    }),
});

// One KDP rule per file, answered first and sourced to Amazon's own pages.
const facts = defineCollection({
  loader: glob({ pattern: '*.md', base: './data/facts' }),
  schema: z
    .object({
      title: z.string().min(10).max(90),
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

export const collections = { tools, facts, best, compare, glossary, reports };
