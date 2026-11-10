/**
 * Whether an image is big enough for a cover that needs needW x needH pixels at 300 DPI.
 * dpi is the effective resolution if the image is scaled to cover the full wrap.
 * ratioOff is true when the shapes differ by more than 1%, so the image would be cropped or stretched.
 */
export function imageCheck(w: number, h: number, needW: number, needH: number) {
  const dpi = Math.floor(Math.min((w / needW) * 300, (h / needH) * 300));
  const ratioOff = Math.abs(w / h / (needW / needH) - 1) > 0.01;
  return { ok: w >= needW && h >= needH && !ratioOff, dpi, ratioOff };
}
