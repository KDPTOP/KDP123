---
title: "KDP bleed size and minimum margins by page count"
seo_title: "KDP Bleed and Margins by Page Count"
question: "What bleed and margin sizes does Amazon KDP require for a print book interior?"
answer: >-
  KDP bleed is 0.125 in (3.2 mm) on the top, bottom and outside edges, so a 6 x 9 in book with bleed uses a 6.125 x
  9.25 in page. Outside margins must be at least 0.25 in without bleed or 0.375 in with bleed, and the gutter grows
  with page count from 0.375 in to 0.875 in.
topic: print
key_facts:
  - { label: "Bleed", value: "0.125 in (3.2 mm) top, bottom and outside" }
  - { label: "Page width with bleed", value: "Trim width + 0.125 in" }
  - { label: "Page height with bleed", value: "Trim height + 0.25 in" }
  - { label: "Outside margin, no bleed", value: "At least 0.25 in (6.4 mm)" }
  - { label: "Outside margin, with bleed", value: "At least 0.375 in (9.6 mm)" }
  - { label: "Inside margin, 24-150 pages", value: "0.375 in (9.6 mm)" }
  - { label: "Inside margin, 701-828 pages", value: "0.875 in (22.3 mm)" }
faq:
  - q: "If only one page has a full-bleed image, do I need bleed on the whole file?"
    a: "Yes. KDP says that if even one page requires bleed, the entire interior file should be set up with bleed."
  - q: "Can I upload a Word file with bleed?"
    a: "No. Bleed is only supported for fixed-format files such as print-ready PDFs."
  - q: "Do top, bottom and outside margins have to match?"
    a: "No. They can differ, for example 1 in top and bottom with a 0.375 in outside margin, as long as each meets the minimum."
related_tools: [amazon-kdp, atticus, vellum]
status: published
verified_at: 2026-11-09
sources:
  - https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6
  - https://kdp.amazon.com/en_US/help/topic/G201857950
---

## How bleed works

Every printed page is trimmed by cutting 0.125 in (3.2 mm) from the top, bottom and outside edge. For an image or background to reach the edge, it must extend past the trim line by that amount, so the page size of your file grows:

- Page width with bleed = trim width + 0.125 in (only the outside edge is trimmed, not the spine edge).
- Page height with bleed = trim height + 0.25 in (top and bottom).

For a 6 x 9 in book the bleed page size is 6.125 x 9.25 in; for 8.5 x 11 in it is 8.625 x 11.25 in. Covers always need bleed; for the interior it is your choice.

## Minimum margins by page count

The inside margin, or gutter, gets wider as books get thicker so text does not disappear into the spine.

| Page count | Inside (gutter) | Outside, no bleed | Outside, with bleed |
| --- | --- | --- | --- |
| 24 to 150 | 0.375 in (9.6 mm) | 0.25 in (6.4 mm) | 0.375 in (9.6 mm) |
| 151 to 300 | 0.5 in (12.7 mm) | 0.25 in | 0.375 in |
| 301 to 500 | 0.625 in (15.9 mm) | 0.25 in | 0.375 in |
| 501 to 700 | 0.75 in (19.1 mm) | 0.25 in | 0.375 in |
| 701 to 828 | 0.875 in (22.3 mm) | 0.25 in | 0.375 in |

"Outside" here means the top, bottom and outer edge margins.

## Common mistakes

- Adding 0.25 in to the width. Bleed adds 0.125 in to width and 0.25 in to height.
- Setting different values for "inside margin" and "gutter" in software that has both fields. KDP asks for the same value in each.
- Keeping the same gutter when a revision pushes the book past 150, 300, 500 or 700 pages.
- Leaving text in the bleed area. With bleed, keep text at least 0.375 in from the trimmed edges.

Amazon changes these rules; the linked KDP help pages are the authority.
