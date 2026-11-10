// KDP launch dates from data/facts/ebook-preorders.md and hardcover-and-paperback-preorders.md.
// Ebook pre-order: final file at least 72 hours before release (release dates are GMT); up to 18 months ahead for
// pre-orders created on or after 2026-09-02 (12 before); up to 2 postponements, no later than 6 months past the
// original date. Print: no pre-orders, a scheduled release up to 90 days ahead, locked from 5 days before release.

export const FILE_HOURS = 72;
export const RULES_CHANGED = '2026-09-02';
export const PRINT_AHEAD_DAYS = 90;
export const PRINT_LOCK_DAYS = 5;
export const EARLIEST_MOVE_UP_DAYS = 3;

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const addMonths = (d: Date, n: number) => {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate();
  x.setUTCDate(Math.min(d.getUTCDate(), last));
  return x;
};
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);

export interface EbookPlan {
  fileDeadline: Date;
  latestRelease: Date;
  latestPostpone: Date;
  postponements: number;
  leadMonths: number;
  tooFar: boolean;
  tooSoon: boolean;
}

/** `release` and `created` are YYYY-MM-DD; the deadline is 00:00 GMT three days before release. */
export function ebookPlan(release: string, created: string): EbookPlan {
  const r = day(release);
  const c = day(created);
  const newRules = created >= RULES_CHANGED;
  const leadMonths = newRules ? 18 : 12;
  const latestRelease = addMonths(c, leadMonths);
  return {
    fileDeadline: addDays(r, -FILE_HOURS / 24),
    latestRelease,
    latestPostpone: newRules ? addMonths(r, 6) : addDays(r, 30),
    postponements: newRules ? 2 : 1,
    leadMonths,
    tooFar: r > latestRelease,
    tooSoon: daysBetween(c, r) < EARLIEST_MOVE_UP_DAYS,
  };
}

export interface PrintPlan {
  lockFrom: Date;
  latestRelease: Date;
  tooFar: boolean;
}

export function printPlan(release: string, today: string): PrintPlan {
  const r = day(release);
  const latestRelease = addDays(day(today), PRINT_AHEAD_DAYS);
  return { lockFrom: addDays(r, -PRINT_LOCK_DAYS), latestRelease, tooFar: r > latestRelease };
}
