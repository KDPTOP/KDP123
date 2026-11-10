// Kindle+ (formerly Kindle Unlimited) page-read earnings, from data/facts/kenp-royalties.md.
// Earnings = KENP read x the month's KENP rate. The rate changes monthly, so the visitor enters it.
// Each customer pays for at most 3,000 KENP per title, and only the first read of each page counts.

export const KENP_CAP = 3000;

export const earnings = (pagesRead: number, rate: number) => Math.max(0, pagesRead) * Math.max(0, rate);

/** What one subscriber reading the whole book pays you. */
export const perFullRead = (kenpc: number, rate: number) => Math.min(Math.max(0, kenpc), KENP_CAP) * Math.max(0, rate);

/** Pages read expressed as whole-book reads. */
export const fullReads = (pagesRead: number, kenpc: number) => (kenpc > 0 ? pagesRead / Math.min(kenpc, KENP_CAP) : 0);

/** Pages a reader must get through to earn what one sale pays. */
export const pagesToMatchSale = (saleRoyalty: number, rate: number) => (rate > 0 ? Math.ceil(saleRoyalty / rate) : Infinity);
