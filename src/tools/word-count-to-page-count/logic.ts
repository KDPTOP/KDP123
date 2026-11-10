// Word count -> printed page estimate. A typesetting model, not a KDP rule: KDP counts pages from your file.
// Text block = trim minus 0.75 in top, bottom and outside margins and KDP's minimum gutter for the page count;
// characters per line = width / (0.5 x font size); 6 characters per word including the space; leading 1.2 x size;
// 85% of each full page holds text (paragraph ends, dialogue, headings); each chapter opens on a new page.

import { gutterFor } from '../interior-margin-calculator/logic';

export const MARGIN = 0.75;
export const CHARS_PER_WORD = 6;
export const LEADING = 1.2;
export const FILL = 0.85;
export const MIN_PAGES = 24;

export function wordsPerPage(trimW: number, trimH: number, fontPt: number, pagesGuess = 300): number {
  const width = (trimW - MARGIN - gutterFor(pagesGuess)) * 72;
  const height = (trimH - 2 * MARGIN) * 72;
  const charsPerLine = width / (fontPt * 0.5);
  const lines = Math.floor(height / (fontPt * LEADING));
  return Math.max(1, Math.round((charsPerLine / CHARS_PER_WORD) * lines * FILL));
}

export interface PageEstimate {
  pages: number;
  wordsPerPage: number;
  textPages: number;
}

/** Iterates once so the gutter matches the estimated page count. */
export function estimatePages(words: number, trimW: number, trimH: number, fontPt: number, chapters = 0, extraPages = 8): PageEstimate {
  let pages = 300;
  let wpp = 0;
  let textPages = 0;
  for (let i = 0; i < 3; i++) {
    wpp = wordsPerPage(trimW, trimH, fontPt, pages);
    textPages = Math.ceil(words / wpp);
    const raw = textPages + Math.ceil(chapters * 0.5) + extraPages;
    pages = Math.max(MIN_PAGES, raw + (raw % 2));
  }
  return { pages, wordsPerPage: wpp, textPages };
}
