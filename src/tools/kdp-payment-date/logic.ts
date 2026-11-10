// When KDP pays a month's royalties, from data/facts/royalty-payments.md: about 60 days after the end of the month
// of sale (January sales paid at the end of March), about 90 days for paperback Expanded Distribution.
// Dates are UTC calendar days; KDP gives "about", so the tool shows the end of that month as the expected date.

export type Channel = 'amazon' | 'expanded';
export type Method = 'deposit' | 'deposit_india' | 'wire' | 'check';

export const MONTHS_AFTER: Record<Channel, number> = { amazon: 2, expanded: 3 };
/** Days from the payment date until the money lands, from KDP's payment FAQ. */
export const ARRIVAL: Record<Method, { min: number; max: number; business: boolean; label: string }> = {
  deposit: { min: 1, max: 5, business: true, label: 'Direct deposit: 1 to 5 business days' },
  deposit_india: { min: 7, max: 10, business: true, label: 'Direct deposit to a bank in India: 7 to 10 business days' },
  wire: { min: 5, max: 10, business: true, label: 'Wire transfer: 5 to 10 days' },
  check: { min: 0, max: 30, business: false, label: 'Check: up to 30 days' },
};

/** Last day of the month `monthsAfter` months after the sale month (month is 1-12). */
export function paymentDate(year: number, month: number, channel: Channel = 'amazon'): Date {
  return new Date(Date.UTC(year, month - 1 + MONTHS_AFTER[channel] + 1, 0));
}

export function addBusinessDays(d: Date, n: number): Date {
  const x = new Date(d);
  let left = n;
  while (left > 0) {
    x.setUTCDate(x.getUTCDate() + 1);
    const day = x.getUTCDay();
    if (day !== 0 && day !== 6) left--;
  }
  return x;
}

export function arrivalWindow(paid: Date, method: Method): [Date, Date] {
  const a = ARRIVAL[method];
  const add = (n: number) => (a.business ? addBusinessDays(paid, n) : new Date(paid.getTime() + n * 86400000));
  return [add(a.min), add(a.max)];
}

export const daysUntil = (d: Date, today: Date) => Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / 86400000);

/** The sale months whose payments are still ahead of `today`, oldest first. */
export function upcoming(today: Date, channel: Channel = 'amazon', n = 4): { sale: string; paid: Date }[] {
  const out: { sale: string; paid: Date }[] = [];
  for (let back = MONTHS_AFTER[channel] + 1; back >= 0 && out.length < n; back--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - back, 1));
    const paid = paymentDate(d.getUTCFullYear(), d.getUTCMonth() + 1, channel);
    if (daysUntil(paid, today) >= 0) out.push({ sale: d.toISOString().slice(0, 7), paid });
  }
  return out;
}
