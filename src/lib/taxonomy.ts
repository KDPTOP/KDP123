export const STAGES = [
  { slug: 'research', name: 'Research', blurb: 'Pick a niche, keywords and categories before you make anything.' },
  { slug: 'create', name: 'Create', blurb: 'Write, design and format the interior and the cover.' },
  { slug: 'publish', name: 'Publish', blurb: 'KDP itself, print and distribution, ISBNs, copyright and trademarks.' },
  { slug: 'market', name: 'Market', blurb: 'Ads, promotions, reviews and email.' },
  { slug: 'track', name: 'Track', blurb: 'Sales, rank and royalty tracking after launch.' },
  { slug: 'learn', name: 'Learn', blurb: 'Courses, blogs, channels and communities worth your time.' },
] as const;

export const CATEGORIES = [
  { slug: 'book-research', stage: 'research', name: 'Book & Niche Research', blurb: 'Tools that estimate demand, competition and sales for books on Amazon.' },
  { slug: 'keywords-categories', stage: 'research', name: 'Keywords & Categories', blurb: 'Find the search terms and Amazon categories a book should target.' },
  { slug: 'low-content', stage: 'create', name: 'Low-content & Puzzle Books', blurb: 'Journals, planners, puzzle, activity and coloring book makers.' },
  { slug: 'cover-design', stage: 'create', name: 'Cover Design & Mockups', blurb: 'Cover makers, templates and 3D mockups for KDP.' },
  { slug: 'writing-formatting', stage: 'create', name: 'Writing & Formatting', blurb: 'Writing apps and formatters that export KDP-ready EPUB and print PDF.' },
  { slug: 'ai-tools', stage: 'create', name: 'AI Tools', blurb: 'AI for text, art and covers, with what KDP does and does not require you to disclose.' },
  { slug: 'editing', stage: 'create', name: 'Editing & Proofreading', blurb: 'Editing software and services.' },
  { slug: 'official', stage: 'publish', name: 'Official KDP & Amazon', blurb: 'First-party Amazon tools and help. The source of truth for rules.' },
  { slug: 'print-distribution', stage: 'publish', name: 'Print & Distribution', blurb: 'Print-on-demand and wide distribution beyond KDP.' },
  { slug: 'audio', stage: 'publish', name: 'Audiobooks', blurb: 'Audiobook production and distribution.' },
  { slug: 'legal-isbn', stage: 'publish', name: 'ISBN, Copyright & Trademark', blurb: 'Registries and search tools for identifiers, copyright and brand names.' },
  { slug: 'ads-promotion', stage: 'market', name: 'Ads & Promotion', blurb: 'Amazon Ads, book promotion sites and newsletter deals.' },
  { slug: 'reviews-arc', stage: 'market', name: 'Reviews & ARC', blurb: 'Advance reader copies and review services.' },
  { slug: 'email-tools', stage: 'market', name: 'Email & Reader Magnets', blurb: 'Email service providers and reader-magnet delivery.' },
  { slug: 'analytics', stage: 'track', name: 'Sales & Rank Tracking', blurb: 'Track sales, BSR, ads and royalties across your catalog.' },
  { slug: 'courses-blogs', stage: 'learn', name: 'Courses, Blogs & Channels', blurb: 'Teaching resources for KDP publishers.' },
  { slug: 'communities', stage: 'learn', name: 'Communities & Forums', blurb: 'Where KDP publishers ask questions and compare notes.' },
] as const;

export type StageSlug = (typeof STAGES)[number]['slug'];
export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

// z.enum needs a non-empty tuple of literals.
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as unknown as [CategorySlug, ...CategorySlug[]];

/** Categories that have at least one published listing. Empty ones get no page: thin pages hurt a directory. */
export const nonEmpty = (used: Iterable<string>) => {
  const set = new Set(used);
  return CATEGORIES.filter((c) => set.has(c.slug));
};

export const FACT_TOPICS = [
  { slug: 'royalties', name: 'Royalties & payments' },
  { slug: 'print', name: 'Print books' },
  { slug: 'ebooks', name: 'Ebooks' },
  { slug: 'programs', name: 'KDP Select & programs' },
  { slug: 'content', name: 'Content rules' },
  { slug: 'metadata', name: 'Metadata & listing' },
  { slug: 'account', name: 'Account & tax' },
] as const;
export type FactTopicSlug = (typeof FACT_TOPICS)[number]['slug'];
export const FACT_TOPIC_SLUGS = FACT_TOPICS.map((t) => t.slug) as unknown as [FactTopicSlug, ...FactTopicSlug[]];

export const stageBySlug = (slug: string) => STAGES.find((s) => s.slug === slug);
export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const categoriesOfStage = (stage: string) => CATEGORIES.filter((c) => c.stage === stage);
