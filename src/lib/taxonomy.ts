export const STAGES = [
  { slug: 'research', seoTitle: 'KDP Research Tools: Niche, Keyword & Category', name: 'Research', blurb: 'Pick a niche, keywords and categories before you make anything.' },
  { slug: 'create', seoTitle: 'KDP Book Creation Tools: Write, Design, Format', name: 'Create', blurb: 'Write, design and format the interior and the cover.' },
  { slug: 'publish', seoTitle: 'KDP Publishing Tools: Print, ISBN & Distribution', name: 'Publish', blurb: 'KDP itself, print and distribution, ISBNs, copyright and trademarks.' },
  { slug: 'market', seoTitle: 'KDP Marketing Tools: Ads, Promos & Reviews', name: 'Market', blurb: 'Ads, promotions, reviews and email.' },
  { slug: 'track', seoTitle: 'KDP Sales & Royalty Tracking Tools', name: 'Track', blurb: 'Sales, rank and royalty tracking after launch.' },
  { slug: 'learn', seoTitle: 'KDP Courses, Blogs, YouTube & Communities', name: 'Learn', blurb: 'Courses, blogs, channels and communities worth your time.' },
] as const;

export const CATEGORIES = [
  { slug: 'book-research', seoTitle: 'KDP Book & Niche Research Tools', stage: 'research', name: 'Book & Niche Research', blurb: 'Tools that estimate demand, competition and sales for books on Amazon.' },
  { slug: 'keywords-categories', seoTitle: 'KDP Keyword & Category Research Tools', stage: 'research', name: 'Keywords & Categories', blurb: 'Find the search terms and Amazon categories a book should target.' },
  { slug: 'low-content', seoTitle: 'KDP Low-Content, Puzzle & Coloring Book Tools', stage: 'create', name: 'Low-content & Puzzle Books', blurb: 'Journals, planners, puzzle, activity and coloring book makers.' },
  { slug: 'cover-design', seoTitle: 'KDP Book Cover Design & Mockup Tools', stage: 'create', name: 'Cover Design & Mockups', blurb: 'Cover makers, templates and 3D mockups for KDP.' },
  { slug: 'writing-formatting', seoTitle: 'Book Writing & Formatting Software for KDP', stage: 'create', name: 'Writing & Formatting', blurb: 'Writing apps and formatters that export KDP-ready EPUB and print PDF.' },
  { slug: 'ai-tools', seoTitle: 'AI Tools for KDP: Text, Art & Covers', stage: 'create', name: 'AI Tools', blurb: 'AI for text, art and covers, with what KDP does and does not require you to disclose.' },
  { slug: 'editing', seoTitle: 'Book Editing & Proofreading Tools for KDP', stage: 'create', name: 'Editing & Proofreading', blurb: 'Editing software and services.' },
  { slug: 'official', seoTitle: 'Official Amazon KDP Tools & Help Pages', stage: 'publish', name: 'Official KDP & Amazon', blurb: 'First-party Amazon tools and help. The source of truth for rules.' },
  { slug: 'print-distribution', seoTitle: 'Print-on-Demand & Distribution Beyond KDP', stage: 'publish', name: 'Print & Distribution', blurb: 'Print-on-demand and wide distribution beyond KDP.' },
  { slug: 'direct-sales', seoTitle: 'Sell Books Direct: Ebook Storefronts for Authors', stage: 'publish', name: 'Direct Sales & Storefronts', blurb: 'Sell ebooks, PDFs and print books from your own store. Not allowed for ebooks enrolled in KDP Select.' },
  { slug: 'audio', seoTitle: 'Audiobook Production & Distribution for KDP', stage: 'publish', name: 'Audiobooks', blurb: 'Audiobook production and distribution.' },
  { slug: 'legal-isbn', seoTitle: 'ISBN, Copyright & Trademark Tools for Authors', stage: 'publish', name: 'ISBN, Copyright & Trademark', blurb: 'Registries and search tools for identifiers, copyright and brand names.' },
  { slug: 'ads-promotion', seoTitle: 'Amazon Ads & Book Promotion Tools for KDP', stage: 'market', name: 'Ads & Promotion', blurb: 'Amazon Ads, book promotion sites and newsletter deals.' },
  { slug: 'reviews-arc', seoTitle: 'Book Review & ARC Services for KDP Authors', stage: 'market', name: 'Reviews & ARC', blurb: 'Advance reader copies and review services.' },
  { slug: 'email-tools', seoTitle: 'Email Marketing & Reader Magnet Tools for Authors', stage: 'market', name: 'Email & Reader Magnets', blurb: 'Email service providers and reader-magnet delivery.' },
  { slug: 'analytics', seoTitle: 'KDP Sales & BSR Tracking Tools', stage: 'track', name: 'Sales & Rank Tracking', blurb: 'Track sales, BSR, ads and royalties across your catalog.' },
  { slug: 'courses-blogs', seoTitle: 'KDP Courses, Blogs & YouTube Channels', stage: 'learn', name: 'Courses, Blogs & Channels', blurb: 'Teaching resources for KDP publishers.' },
  { slug: 'communities', seoTitle: 'KDP Communities & Self-Publishing Forums', stage: 'learn', name: 'Communities & Forums', blurb: 'Where KDP publishers ask questions and compare notes.' },
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

// How a tool handles one KDP output. native: built-in KDP preset or export; manual: possible, but you enter KDP's specs
// yourself; na: the tool does not make this; unverified: nobody has checked the vendor's pages yet.
export const FIT_LEVELS = ['native', 'manual', 'na', 'unverified'] as const;
export const FIT_SCOPES = ['cover', 'interior', 'ebook', 'print'] as const;
export type FitLevel = (typeof FIT_LEVELS)[number];
export type FitScope = (typeof FIT_SCOPES)[number];

export const FIT_SCOPE_INFO: Record<FitScope, { name: string; means: string }> = {
  cover: { name: 'Cover', means: 'Ebook cover image or paperback/hardcover full-wrap cover at KDP size, with spine and bleed' },
  interior: { name: 'Interior', means: 'Print interior laid out to a KDP trim size, with KDP margins, gutter and bleed' },
  ebook: { name: 'Ebook', means: 'Kindle ebook file KDP accepts (EPUB, KPF or DOCX) that previews cleanly' },
  print: { name: 'Print file', means: 'Print-ready PDF that passes KDP checks: page size, embedded fonts, 300 DPI images' },
};

export const FIT_LEVEL_INFO: Record<FitLevel, { label: string; badge: string }> = {
  native: { label: 'Built-in KDP preset', badge: 'badge-ok' },
  manual: { label: 'Possible, set up by hand', badge: 'badge-warn' },
  na: { label: 'Does not make this', badge: '' },
  unverified: { label: 'Not checked yet', badge: '' },
};

/** KDP fact pages that matter when choosing tools in each category. Category pages link to them; a missing fact fails the build. */
export const CATEGORY_FACTS: Record<string, string[]> = {
  'book-research': ['keywords-and-categories', 'paperback-royalties', 'ebook-royalties'],
  'keywords-categories': ['keywords-and-categories', 'title-and-metadata-guidelines', 'book-description-rules'],
  'low-content': ['low-content-books', 'trim-sizes', 'bleed-and-margins', 'page-count-limits'],
  'cover-design': ['cover-dimensions', 'bleed-and-margins', 'trim-sizes', 'ai-content-disclosure'],
  'writing-formatting': ['trim-sizes', 'bleed-and-margins', 'ebook-file-formats', 'page-count-limits'],
  'ai-tools': ['ai-content-disclosure', 'public-domain-content', 'cover-dimensions'],
  editing: ['book-description-rules', 'title-and-metadata-guidelines'],
  official: ['kdp-select-rules', 'royalty-payments', 'tax-interview'],
  'print-distribution': ['expanded-distribution', 'printing-costs', 'author-copies-and-proofs', 'hardcover-royalties'],
  'direct-sales': ['kdp-select-rules', 'ebook-pricing-rules'],
  'legal-isbn': ['isbn-rules', 'public-domain-content', 'low-content-books'],
  'ads-promotion': ['a-plus-content', 'ebook-preorders', 'kdp-select-rules'],
  'reviews-arc': ['ebook-preorders', 'hardcover-and-paperback-preorders'],
  'email-tools': ['kdp-select-rules'],
  analytics: ['kenp-royalties', 'royalty-payments', 'paperback-royalties'],
  'courses-blogs': ['keywords-and-categories', 'kdp-select-rules', 'ai-content-disclosure'],
};
