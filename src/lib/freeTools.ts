export interface FreeTool {
  slug: string;
  name: string;
  /** One line for lists and meta descriptions. */
  blurb: string;
  /** Fact pages the tool is built on; those pages link back. */
  facts: string[];
}

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: 'royalty-calculator',
    name: 'KDP royalty and printing cost calculator',
    blurb: 'Royalty per sale for paperback, hardcover and Kindle ebooks on Amazon.com, with printing cost, minimum list price and the $9.99 cliff.',
    facts: ['paperback-royalties', 'hardcover-royalties', 'printing-costs', 'ebook-royalties', 'expanded-distribution'],
  },
  {
    slug: 'cover-size-calculator',
    name: 'KDP paperback cover size and spine width calculator',
    blurb: 'Full-wrap cover size in inches, millimetres and 300 DPI pixels, spine width by paper type, and whether spine text is allowed.',
    facts: ['cover-dimensions', 'trim-sizes', 'bleed-and-margins', 'page-count-limits'],
  },
  {
    slug: 'ebook-price-checker',
    name: 'Kindle ebook price checker',
    blurb: 'Checks a US list price against the 35% and 70% royalty bands, the file-size minimums and the 20%-below-print rule.',
    facts: ['ebook-pricing-rules', 'ebook-royalties'],
  },
  {
    slug: 'description-checker',
    name: 'KDP book description formatter and checker',
    blurb: 'Turns plain text into KDP-safe HTML and flags length, unsupported tags, unclosed tags, links, prices, reviews and emojis.',
    facts: ['book-description-rules', 'title-and-metadata-guidelines'],
  },
  {
    slug: 'keyword-checker',
    name: 'KDP keyword slot checker',
    blurb: 'Checks your seven keyword slots against Amazon\'s list of keywords to avoid and finds words wasted on repeats.',
    facts: ['keywords-and-categories', 'title-and-metadata-guidelines'],
  },
  {
    slug: 'category-finder',
    name: 'KDP category finder',
    blurb: 'Describe your book or paste an ASIN and get matching Amazon categories with the KDP path, list size and median price. Data from KDPTop.',
    facts: ['keywords-and-categories'],
  },
  {
    slug: 'bsr-sales-estimator',
    name: 'Amazon BSR to sales estimator',
    blurb: 'Rough daily and monthly sales for an Amazon.com Best Sellers Rank, for books and Kindle ebooks. An order-of-magnitude estimate.',
    facts: ['paperback-royalties', 'ebook-royalties', 'kenp-royalties'],
  },
];

export const freeToolsForFact = (factId: string) => FREE_TOOLS.filter((t) => t.facts.includes(factId));
export const freeTool = (slug: string) => FREE_TOOLS.find((t) => t.slug === slug)!;
