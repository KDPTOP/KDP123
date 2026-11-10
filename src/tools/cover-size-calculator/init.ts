import { paperbackCover, px300, MM, BLEED, SPINE_TEXT_MIN_PAGES, type Paper } from '../../lib/calc/listing';
import { $, $$, bindForm, copyButtons } from '../shared';
import { imageCheck } from './logic';

const inch = (v: number) => `${v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} in`;

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const svg = $(root, '[data-el="svg"]');
  const spineEl = $(root, '[data-el="spine"]');
  const imgEl = $(root, '[data-el="img"]');
  const q = (k: string) => $(root, `[data-k="${k}"]`);
  let image: { w: number; h: number; name: string } | undefined;
  let need = { w: 0, h: 0 };

  function showImage() {
    if (!image) return;
    const r = imageCheck(image.w, image.h, need.w, need.h);
    imgEl.hidden = false;
    const size = `${image.name}: ${image.w.toLocaleString('en-US')} x ${image.h.toLocaleString('en-US')} px`;
    const target = `${need.w.toLocaleString('en-US')} x ${need.h.toLocaleString('en-US')} px`;
    imgEl.className = r.ok ? 'issue-ok' : r.dpi >= 300 ? 'issue-warn' : 'issue-error';
    imgEl.textContent = r.ok
      ? `${size}, ${r.dpi} DPI for this cover. Big enough.`
      : r.dpi >= 300
        ? `${size}. Big enough, but a different shape from the ${target} this cover needs, so it would be cropped or stretched. Check the trim size and page count.`
        : `${size}, about ${r.dpi} DPI. This cover needs at least ${target} for 300 DPI.`;
  }

  function run() {
    const f = new FormData(form);
    const preset = String(f.get('preset'));
    $$(root, '[data-custom]').forEach((el) => (el.hidden = preset !== 'custom'));
    const [w, h] = preset === 'custom' ? [Number(f.get('w')), Number(f.get('h'))] : preset.split(' x ').map(Number);
    const pages = Math.max(24, Math.min(828, Number(f.get('pages')) || 0));
    const c = paperbackCover(w, h, pages, f.get('paper') as Paper);
    need = { w: px300(c.width), h: px300(c.height) };
    q('w').textContent = inch(c.width);
    q('h').textContent = inch(c.height);
    q('spine').textContent = inch(c.spine);
    q('px').textContent = `${need.w.toLocaleString('en-US')} x ${need.h.toLocaleString('en-US')}`;
    q('mm').textContent = `In millimetres: ${(c.width * MM).toFixed(1)} x ${(c.height * MM).toFixed(1)} mm, spine ${(c.spine * MM).toFixed(2)} mm. Calculated for ${c.pages} pages.`;
    spineEl.className = c.spineText ? 'issue-ok' : 'issue-warn';
    spineEl.textContent = c.spineText
      ? `Spine text allowed. With 0.0625 in clearance each side, the text area is ${inch(c.spineTextWidth)} wide.`
      : `No spine text: KDP needs at least ${SPINE_TEXT_MIN_PAGES} pages. Leave the spine blank or use a plain color.`;

    const W = c.width, H = c.height, b = BLEED;
    const x1 = b + w, x2 = x1 + c.spine;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <rect x="0" y="0" width="${W}" height="${H}" fill="var(--line)"/>
      <rect x="${b}" y="${b}" width="${W - 2 * b}" height="${H - 2 * b}" fill="var(--surface)" stroke="var(--ink)" stroke-width="0.02" stroke-dasharray="0.08 0.06"/>
      <rect x="${x1}" y="${b}" width="${c.spine}" height="${H - 2 * b}" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="0.015"/>
      <text x="${b + w / 2}" y="${H / 2}" font-size="0.45" text-anchor="middle" fill="var(--muted)">Back</text>
      <text x="${x2 + w / 2}" y="${H / 2}" font-size="0.45" text-anchor="middle" fill="var(--muted)">Front</text>`;
    showImage();
  }

  const file = $<HTMLInputElement>(root, '[data-el="file"]');
  const drop = $(root, '[data-el="drop"]');
  const read = (f?: File) => {
    if (!f || !/^image\/(png|jpeg)$/.test(f.type)) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      image = { w: img.naturalWidth, h: img.naturalHeight, name: f.name };
      URL.revokeObjectURL(url);
      showImage();
    };
    img.src = url;
  };
  file.addEventListener('change', () => read(file.files?.[0]));
  drop.addEventListener('dragover', (e) => e.preventDefault());
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    read(e.dataTransfer?.files[0]);
  });

  bindForm(root, form, params, run);
  copyButtons(root);
}
