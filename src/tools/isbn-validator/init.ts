import { validate, ean13Svg } from './logic';
import { $, bindForm, copyButtons, notes } from '../shared';

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const k = (name: string) => $(root, `[data-k="${name}"]`);
  const box = $(root, '[data-el="barcode-box"]');
  const code = $(root, '[data-el="barcode"]');
  const dl = $<HTMLButtonElement>(root, '[data-el="download"]');
  const list = $(root, '[data-el="notes"]');
  let svg = '';
  let name = 'isbn';

  dl.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    Object.assign(document.createElement('a'), { href: url, download: `${name}-barcode.svg` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  function run() {
    const raw = String(new FormData(form).get('isbn') ?? '');
    const r = validate(raw);
    const rows: [string, string][] = [];
    k('isbn13').textContent = r.valid && r.isbn13 ? r.isbn13 : '-';
    k('isbn10').textContent = !r.valid ? '-' : (r.isbn10 ?? (r.isbn13?.startsWith('979') ? 'none (979 prefix)' : '-'));
    if (r.kind === 'invalid') {
      k('status').textContent = raw.trim() ? 'Not an ISBN' : '-';
      if (raw.trim()) rows.push(['issue-error', r.problem!]);
    } else if (r.valid) {
      k('status').textContent = 'Valid';
      rows.push(['issue-ok', `The check digit ${r.expected} is correct for this ${r.kind === 'isbn13' ? 'ISBN-13' : 'ISBN-10'}.`]);
    } else {
      k('status').textContent = 'Wrong';
      rows.push(['issue-error', `The last digit should be ${r.expected}, not ${r.input.slice(-1)}. Usually a typo: check every digit against your ISBN agency record.`]);
      const fixed = r.kind === 'isbn13' ? r.isbn13 : r.isbn10;
      rows.push(['issue-warn', `If only the last digit is wrong, the number is ${fixed}. A different digit may be the typo, so don't just swap the last one.`]);
    }
    if (r.problem && r.kind !== 'invalid') rows.push(['issue-warn', r.problem]);
    const show = r.kind !== 'invalid' && r.valid && !!r.isbn13 && /^97[89]/.test(r.isbn13);
    box.hidden = !show;
    if (show) {
      svg = ean13Svg(r.isbn13!);
      name = r.isbn13!;
      code.innerHTML = svg;
      rows.push(['issue-ok', 'KDP can add the barcode to your cover for you. If you place your own, use the barcode area on KDP\'s cover template.']);
    }
    rows.push(['issue-ok', 'A correct check digit only means the number is well-formed. KDP also checks that the title, author and imprint match the ISBN agency record.']);
    notes(list, rows);
  }

  bindForm(root, form, params, run);
  copyButtons(root);
}
