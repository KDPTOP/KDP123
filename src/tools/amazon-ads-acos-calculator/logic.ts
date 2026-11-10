// Amazon Ads arithmetic for books. ACoS = ad spend / ad sales; break-even ACoS = royalty / list price.
// Cost per sale = CPC / conversion rate. Pure math; the royalty comes from the royalty calculator.

export interface AdsInput {
  price: number;
  royalty: number;
  /** Average cost per click, USD. */
  cpc: number;
  /** Clicks that turn into a sale, percent. */
  cvr: number;
}

export interface AdsResult {
  breakEvenAcos: number;
  acos: number;
  costPerSale: number;
  profitPerSale: number;
  maxCpc: number;
  roas: number;
  clicksPerSale: number;
}

export function ads({ price, royalty, cpc, cvr }: AdsInput): AdsResult {
  const rate = cvr / 100;
  const costPerSale = rate > 0 ? cpc / rate : Infinity;
  return {
    breakEvenAcos: price > 0 ? royalty / price : 0,
    acos: price > 0 ? costPerSale / price : Infinity,
    costPerSale,
    profitPerSale: royalty - costPerSale,
    maxCpc: royalty * rate,
    roas: costPerSale > 0 ? price / costPerSale : 0,
    clicksPerSale: rate > 0 ? 1 / rate : Infinity,
  };
}

/** ACoS from a campaign report. */
export const reportAcos = (spend: number, sales: number) => (sales > 0 ? spend / sales : Infinity);
