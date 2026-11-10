// ISBN-10 and ISBN-13 check digits, conversion between them, and the EAN-13 bars for an ISBN-13.

export const digits = (s: string) => s.toUpperCase().replace(/[^0-9X]/g, '');

export function check13(first12: string): number {
  const sum = [...first12].reduce((t, d, i) => t + Number(d) * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}

export function check10(first9: string): string {
  const sum = [...first9].reduce((t, d, i) => t + Number(d) * (10 - i), 0);
  const c = (11 - (sum % 11)) % 11;
  return c === 10 ? 'X' : String(c);
}

export interface IsbnResult {
  input: string;
  kind: 'isbn13' | 'isbn10' | 'invalid';
  valid: boolean;
  expected?: string;
  isbn13?: string;
  isbn10?: string;
  problem?: string;
}

export function validate(raw: string): IsbnResult {
  const d = digits(raw);
  if (d.length === 13) {
    if (d.includes('X')) return { input: d, kind: 'invalid', valid: false, problem: 'An ISBN-13 has digits only; X is used only as an ISBN-10 check digit.' };
    const expected = String(check13(d.slice(0, 12)));
    const valid = expected === d[12];
    const out: IsbnResult = { input: d, kind: 'isbn13', valid, expected, isbn13: valid ? d : d.slice(0, 12) + expected };
    if (!/^97[89]/.test(d)) out.problem = 'ISBN-13s start with 978 or 979.';
    if (out.isbn13!.startsWith('978')) out.isbn10 = to10(out.isbn13!);
    return out;
  }
  if (d.length === 10) {
    if (d.slice(0, 9).includes('X')) return { input: d, kind: 'invalid', valid: false, problem: 'X can only be the last character of an ISBN-10.' };
    const expected = check10(d.slice(0, 9));
    const valid = expected === d[9];
    const fixed = d.slice(0, 9) + expected;
    return { input: d, kind: 'isbn10', valid, expected, isbn10: valid ? d : fixed, isbn13: to13(fixed) };
  }
  return { input: d, kind: 'invalid', valid: false, problem: `${d.length} digits. An ISBN has 10 or 13.` };
}

export const to13 = (isbn10: string) => {
  const core = `978${isbn10.slice(0, 9)}`;
  return core + check13(core);
};

export const to10 = (isbn13: string) => {
  const core = isbn13.slice(3, 12);
  return core + check10(core);
};

/** ISBN-13 with hyphens after the prefix only (registration group lengths vary, so the rest stays together). */

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

/** 95 modules of an EAN-13 symbol as '1' (bar) and '0' (space). */
export function ean13Bits(code: string): string {
  const d = [...code].map(Number);
  const par = PARITY[d[0]];
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += (par[i - 1] === 'L' ? L : G)[d[i]];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += R[d[i]];
  return bits + '101';
}

/** Standalone SVG of the barcode with the digits underneath (for a proof, not a print-ready cover). */
export function ean13Svg(code: string, module = 2, height = 70): string {
  const bits = ean13Bits(code);
  const quiet = 11 * module;
  const w = bits.length * module + quiet * 2;
  const guard = new Set([0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94]);
  let rects = '';
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] !== '1') continue;
    const h = guard.has(i) ? height + 8 : height;
    rects += `<rect x="${quiet + i * module}" y="6" width="${module}" height="${h}"/>`;
  }
  const font = `font-family="monospace" font-size="${module * 7}" text-anchor="middle"`;
  const y = height + 6 + module * 7;
  const text = `<text x="${quiet - module * 4}" y="${y}" ${font}>${code[0]}</text>` +
    `<text x="${quiet + 24 * module}" y="${y}" ${font} letter-spacing="${module * 2}">${code.slice(1, 7)}</text>` +
    `<text x="${quiet + 71 * module}" y="${y}" ${font} letter-spacing="${module * 2}">${code.slice(7)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${y + 6}" width="${w}" height="${y + 6}"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${rects}</g><g fill="#000">${text}</g></svg>`;
}
