import type { IconName } from './icons';

export const TOOL_GROUPS = [
  { id: 'money', name: 'Money', blurb: 'Royalties, prices, page reads, ads and payouts.' },
  { id: 'files', name: 'Files and specs', blurb: 'Cover, interior and ISBN numbers KDP checks on upload.' },
  { id: 'listing', name: 'Listing', blurb: 'Title, keywords, description, categories and launch dates.' },
] as const;
export type ToolGroup = (typeof TOOL_GROUPS)[number]['id'];

export interface FreeTool {
  slug: string;
  group: ToolGroup;
  icon: IconName;
  /** Words people type when they want this tool, for the command box. */
  keywords: string[];
  /** Sends the visitor's input to a data provider (see data/providers). */
  provider?: string;
  name: string;
  /** Two or three words for the home page strip. */
  short: string;
  /** Search title, at most 51 characters so " | KDP123" fits. */
  seoTitle: string;
  /** One line for lists and meta descriptions. */
  blurb: string;
  /** The calculation in one line, for llms.txt and calculators.json. */
  formula: string;
  /** URL parameters that prefill the form, e.g. ?price=12.99&pages=300. */
  params: Record<string, string>;
  /** Fact pages the tool is built on; those pages link back. */
  facts: string[];
  /** Directory category for people who outgrow the free tool. */
  category?: string;
}

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: 'royalty-calculator',
    group: 'money',
    icon: 'coins',
    keywords: ['royalty','royalties','earn','per sale','printing cost','print cost','paperback','hardcover','profit'],
    category: 'analytics',
    short: 'Royalty calculator',
    seoTitle: 'KDP Royalty Calculator for Paperback & Kindle',
    name: 'KDP royalty and printing cost calculator',
    blurb: 'Royalty per sale for paperback, hardcover and Kindle ebooks on Amazon.com, with printing cost, minimum list price and the $9.99 cliff.',
    formula: "Print royalty = list price x 60% (50% under $9.99) - printing cost; printing cost = fixed fee + pages x per-page rate; Kindle 70% royalty = 0.7 x (price - $0.15 per MB delivery).",
    params: { format: "paperback | hardcover | ebook", price: "US list price, USD", pages: "page count (print)", ink: "black | standard_color | premium_color", trim: "regular | large", mb: "ebook file size, MB" },
    facts: ['paperback-royalties', 'hardcover-royalties', 'printing-costs', 'ebook-royalties', 'expanded-distribution'],
  },
  {
    slug: 'ebook-price-checker',
    group: 'money',
    icon: 'tag',
    keywords: ['ebook price','kindle price','70%','35%','price band','delivery fee'],
    category: 'writing-formatting',
    short: 'Ebook price checker',
    seoTitle: 'KDP Ebook Price Calculator: 35% vs 70% Royalty',
    name: 'Kindle ebook price checker',
    blurb: 'Checks a US list price against the 35% and 70% royalty bands, the file-size minimums and the 20%-below-print rule.',
    formula: "35% option: $0.99 to $200 (min $1.99 from 3 MB, $2.99 from 10 MB); 70% option: $2.99 to $12.99 and at most 80% of the print list price.",
    params: { price: "ebook list price, USD", mb: "file size, MB", print: "print edition list price, USD" },
    facts: ['ebook-pricing-rules', 'ebook-royalties'],
  },
  {
    slug: 'kenp-calculator',
    group: 'money',
    icon: 'bookMarked',
    keywords: ['kenp','kenpc','page reads','pages read','kindle unlimited','kindle+','ku','kdp select','global fund'],
    category: 'analytics',
    short: 'KENP earnings',
    seoTitle: 'KENP Calculator: Kindle+ Page Read Earnings',
    name: 'KENP page-read earnings calculator',
    blurb: 'Kindle+ (formerly Kindle Unlimited) earnings from KENP pages read and the month\'s rate, what one full read pays, and pages per sale.',
    formula: "Earnings = KENP read x KENP rate; one full read = min(KENPC, 3000) x rate; pages to match a sale = royalty / rate.",
    params: { pages: "KENP pages read", rate: "KENP rate, USD per page", kenpc: "book length in KENP", sale: "ebook royalty per sale, USD" },
    facts: ['kenp-royalties', 'kdp-select-rules'],
  },
  {
    slug: 'amazon-ads-acos-calculator',
    group: 'money',
    icon: 'target',
    keywords: ['acos','ads','amazon ads','advertising','break even','cpc','cost per click','roas','sponsored products'],
    category: 'ads-promotion',
    short: 'Ads ACoS',
    seoTitle: 'Break-Even ACoS Calculator for KDP Books',
    name: 'Amazon Ads break-even ACoS calculator for books',
    blurb: 'Break-even ACoS from your royalty and list price, the ad cost per sale from CPC and conversion, and the most you can bid per click.',
    formula: "Break-even ACoS = royalty / list price; ad cost per sale = CPC / conversion rate; ACoS = cost per sale / price; max CPC = royalty x conversion rate.",
    params: { price: "list price, USD", royalty: "royalty per sale, USD", cpc: "average cost per click, USD", cvr: "conversion rate, percent" },
    facts: ['paperback-royalties', 'ebook-royalties'],
  },
  {
    slug: 'kdp-payment-date',
    group: 'money',
    icon: 'calendarClock',
    keywords: ['payment','payday','when paid','get paid','royalty payment','payout','direct deposit','wire'],
    short: 'Payment date',
    seoTitle: 'When Will KDP Pay Me? Royalty Payment Dates',
    name: 'KDP royalty payment date countdown',
    blurb: 'When a month\'s KDP royalties are paid, about 60 days after month end (90 for Expanded Distribution), and when the money reaches your bank.',
    formula: "Payment date = last day of the 2nd month after the sale month (3rd for Expanded Distribution); arrival = payment date + transfer time.",
    params: { month: "sale month, YYYY-MM", channel: "amazon | expanded", method: "deposit | deposit_india | wire | check" },
    facts: ['royalty-payments', 'expanded-distribution'],
  },
  {
    slug: 'bsr-sales-estimator',
    group: 'money',
    icon: 'trendingUp',
    keywords: ['bsr','best sellers rank','sales rank','how many sales','sales estimate'],
    provider: 'kdptop',
    category: 'book-research',
    short: 'BSR to sales',
    seoTitle: 'Amazon BSR to Sales Calculator for Books',
    name: 'Amazon BSR to sales estimator',
    blurb: 'Rough daily and monthly sales for an Amazon.com Best Sellers Rank, for books and Kindle ebooks. An order-of-magnitude estimate.',
    formula: "Daily sales = A x BSR^-0.85, with A = 12,000 for print books and 18,000 for Kindle ebooks (KDPTop bsr-power-v1).",
    params: { rank: "Amazon.com Best Sellers Rank", store: "books | kindle", royalty: "royalty per sale, USD" },
    facts: ['paperback-royalties', 'ebook-royalties', 'kenp-royalties'],
  },
  {
    slug: 'cover-size-calculator',
    group: 'files',
    icon: 'ruler',
    keywords: ['cover','spine','wrap','dimensions','cover size','spine width','bleed','pixels'],
    category: 'cover-design',
    short: 'Cover and spine size',
    seoTitle: 'KDP Cover Size & Spine Width Calculator',
    name: 'KDP paperback cover size and spine width calculator',
    blurb: 'Full-wrap cover size in inches, millimetres and 300 DPI pixels, spine width by paper type, and whether spine text is allowed.',
    formula: "Cover width = 0.125 + trim width + spine + trim width + 0.125 in; height = trim height + 0.25 in; spine = pages x paper thickness (0.002252 in white, 0.0025 in cream).",
    params: { preset: "trim size, e.g. 6 x 9", pages: "page count", paper: "white | cream | groundwood | premium_color", w: "custom trim width, in", h: "custom trim height, in" },
    facts: ['cover-dimensions', 'trim-sizes', 'bleed-and-margins', 'page-count-limits'],
  },
  {
    slug: 'word-count-to-page-count',
    group: 'files',
    icon: 'files',
    keywords: ['word count','words','pages','page count','how many pages','manuscript','novel length','80000 words'],
    category: 'writing-formatting',
    short: 'Words to pages',
    seoTitle: 'Word Count to Page Count Calculator for KDP',
    name: 'Word count to page count calculator',
    blurb: 'Estimates the printed page count of a KDP paperback from word count, trim size, font size and chapters, then hands it to the cover and royalty tools.',
    formula: "Pages = words / words per page + half a page per chapter + front and back matter, rounded up to even; words per page from trim, margins and font size.",
    params: { words: "word count", trim: "trim size, e.g. 6 x 9", font: "body font size, pt", chapters: "number of chapters", extra: "front and back matter pages" },
    facts: ['trim-sizes', 'page-count-limits'],
  },
  {
    slug: 'interior-margin-calculator',
    group: 'files',
    icon: 'frame',
    keywords: ['margin','margins','gutter','inside margin','bleed','interior','pdf','page size'],
    category: 'writing-formatting',
    short: 'Interior margins',
    seoTitle: 'KDP Margin & Gutter Calculator by Page Count',
    name: 'KDP interior margin and gutter calculator',
    blurb: 'Minimum gutter and outside margins for a KDP print interior by page count, the PDF page size with or without bleed, and the text block left.',
    formula: "Gutter by page count: 0.375 in (24-150), 0.5 (151-300), 0.625 (301-500), 0.75 (501-700), 0.875 (701-828); outside margins at least 0.25 in, 0.375 in with bleed; bleed page = trim + 0.125 in wide, + 0.25 in tall.",
    params: { trim: "trim size, e.g. 6 x 9", pages: "page count", bleed: "yes | no" },
    facts: ['bleed-and-margins', 'trim-sizes', 'page-count-limits'],
  },
  {
    slug: 'isbn-validator',
    group: 'files',
    icon: 'barcode',
    keywords: ['isbn','isbn-13','isbn-10','check digit','barcode','ean','ean-13','bowker'],
    category: 'legal-isbn',
    short: 'ISBN checker',
    seoTitle: 'ISBN Validator, ISBN-10 to 13 & Barcode',
    name: 'ISBN validator, converter and barcode',
    blurb: 'Checks the ISBN-10 or ISBN-13 check digit, converts between the two and draws an EAN-13 barcode you can download as SVG.',
    formula: "ISBN-13 check = (10 - sum of first 12 digits weighted 1,3,1,3... mod 10) mod 10; ISBN-10 check = (11 - sum weighted 10..2 mod 11) mod 11, X for 10.",
    params: { isbn: "ISBN-10 or ISBN-13" },
    facts: ['isbn-rules', 'low-content-books'],
  },
  {
    slug: 'title-length-checker',
    group: 'listing',
    icon: 'type',
    keywords: ['title','subtitle','title length','characters','200 characters','title rules'],
    category: 'keywords-categories',
    short: 'Title length',
    seoTitle: 'KDP Title & Subtitle Character Counter',
    name: 'KDP title and subtitle length checker',
    blurb: 'Counts title plus subtitle against KDP\'s under-200-character limit and flags promotional words, sales-rank claims, trademarks and stuffing.',
    formula: "Characters used = title length + subtitle length; must stay under 200 (199 is the safe ceiling).",
    params: { title: "book title", subtitle: "subtitle" },
    facts: ['title-and-metadata-guidelines'],
  },
  {
    slug: 'keyword-checker',
    group: 'listing',
    icon: 'key',
    keywords: ['keyword check','keyword slots','7 keywords','backend keywords','banned words'],
    category: 'keywords-categories',
    short: 'Keyword checker',
    seoTitle: 'Free KDP Keyword Checker for All 7 Slots',
    name: 'KDP keyword slot checker',
    blurb: 'Checks your seven keyword slots against Amazon\'s list of keywords to avoid and finds words wasted on repeats.',
    formula: "Seven slots; flags words on Amazon's avoid list and words repeated across slots or already in the title.",
    params: { title: "book title", subtitle: "subtitle" },
    facts: ['keywords-and-categories', 'title-and-metadata-guidelines'],
  },
  {
    slug: 'keyword-builder',
    group: 'listing',
    icon: 'listPlus',
    keywords: ['keyword builder','keyword ideas','dedupe','backend keywords','7 keywords','keyword generator','suggest'],
    provider: 'kdptop',
    category: 'keywords-categories',
    short: 'Keyword builder',
    seoTitle: 'KDP Keyword Builder: Dedupe & Fill 7 Slots',
    name: 'KDP keyword builder',
    blurb: 'Paste keyword ideas, drop plural and spacing duplicates and banned words, and fill KDP\'s seven slots. Optional phrase ideas from KDPTop.',
    formula: "Clean phrases, drop prohibited words, remove plural, spacing and hyphen duplicates, then fill 7 slots in order.",
    params: { ideas: "keyword ideas, one per line or comma-separated", title: "book title", subtitle: "subtitle", limit: "optional characters per slot" },
    facts: ['keywords-and-categories', 'title-and-metadata-guidelines'],
  },
  {
    slug: 'description-checker',
    group: 'listing',
    icon: 'fileText',
    keywords: ['description','blurb','html','book description','formatting'],
    category: 'writing-formatting',
    short: 'Description formatter',
    seoTitle: 'KDP Description HTML Generator & Checker',
    name: 'KDP book description formatter and checker',
    blurb: 'Turns plain text into KDP-safe HTML and flags length, unsupported tags, unclosed tags, links, prices, reviews and emojis.',
    formula: "Up to 4,000 characters including HTML; only br, p, b, em, i, u, h4-h6, ol, ul and li tags.",
    params: { mode: "text | html", text: "plain text or HTML description" },
    facts: ['book-description-rules', 'title-and-metadata-guidelines'],
  },
  {
    slug: 'category-finder',
    group: 'listing',
    icon: 'folderTree',
    keywords: ['category','categories','browse node','asin','niche category'],
    provider: 'kdptop',
    category: 'keywords-categories',
    short: 'Category finder',
    seoTitle: 'Free KDP Category Finder by Keyword or ASIN',
    name: 'KDP category finder',
    blurb: 'Describe your book or paste an ASIN and get matching Amazon categories with the KDP path, list size and median price. Data from KDPTop.',
    formula: "Matches a description or ASIN to Amazon browse categories using KDPTop's category data.",
    params: { mode: "recommend | resolve | node", text: "book description (recommend)", q: "ASIN, ISBN or Amazon link (resolve)", node: "Amazon browse node ID (node)", store: "books | kindle" },
    facts: ['keywords-and-categories'],
  },
  {
    slug: 'preorder-deadline-calculator',
    group: 'listing',
    icon: 'calendarCheck',
    keywords: ['pre-order','preorder','release date','deadline','72 hours','final manuscript','scheduled release','launch'],
    short: 'Pre-order deadline',
    seoTitle: 'KDP Pre-Order Deadline Calculator',
    name: 'KDP pre-order and release date deadline calculator',
    blurb: 'The 72-hour final file deadline for a Kindle pre-order, the latest release and postponement dates, and the print edit lock.',
    formula: "Final file due = release date - 3 days at 00:00 GMT; latest release = setup + 18 months (12 before Sept 2, 2026); print: up to 90 days ahead, locked from release - 5 days.",
    params: { release: "release date, YYYY-MM-DD", created: "pre-order setup date, YYYY-MM-DD", kind: "ebook | print" },
    facts: ['ebook-preorders', 'hardcover-and-paperback-preorders'],
  },
];

export const freeToolsInGroup = (g: ToolGroup) => FREE_TOOLS.filter((t) => t.group === g);
export const freeToolsForFact = (factId: string) => FREE_TOOLS.filter((t) => t.facts.includes(factId));
export const freeTool = (slug: string) => FREE_TOOLS.find((t) => t.slug === slug)!;
