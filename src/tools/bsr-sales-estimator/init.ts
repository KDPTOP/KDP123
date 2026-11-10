import { BSR_CURVE, dailySales, type Curve, type Store } from '../../lib/calc/bsr';
import { $, bindForm, copyButtons } from '../shared';

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const q = (k: string) => $(root, `[data-k="${k}"]`);
  let curve: Curve = BSR_CURVE;

  function run() {
    const f = new FormData(form);
    const d = dailySales(Math.round(Number(f.get('rank'))), f.get('store') as Store, curve);
    const royalty = Number(f.get('royalty'));
    q('day').textContent = d === null ? '-' : `~${d.toLocaleString('en-US')}`;
    const month = d === null ? null : d * 30;
    q('month').textContent = month === null ? '-' : `~${Math.round(month).toLocaleString('en-US')}`;
    q('money').textContent = month !== null && royalty > 0 ? `~$${Math.round(month * royalty).toLocaleString('en-US')}` : '-';
  }

  bindForm(root, form, params, run);
  copyButtons(root);

  // The live curve from KDPTop, when it is reachable and differs from the copy built into the page.
  fetch('/api/kdptop/bsr-curve')
    .then((r) => (r.ok ? r.json() : null))
    .then((live: (Curve & { updated_at?: string }) | null) => {
      if (!live?.A?.books || !live.exp) return;
      const same = live.exp === curve.exp && live.A.books === curve.A.books && live.A.kindle === curve.A.kindle;
      curve = { ...live, synced_at: live.updated_at ?? new Date().toISOString().slice(0, 10) };
      $(root, '[data-el="curve"]').textContent = `KDPTop curve ${live.model ?? ''}, live${same ? '' : ' (updated since this page was built)'}.`;
      if (!same) run();
    })
    .catch(() => {});
}
