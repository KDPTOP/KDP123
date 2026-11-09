import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS } from './lib/taxonomy';

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

export const collections = { tools };
