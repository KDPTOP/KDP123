---
title: "KDP paperback cover size and spine width by page count"
question: "How do I calculate the full cover size and spine width for a KDP paperback?"
answer: >-
  Full cover width is 0.125 in bleed + back cover + spine + front cover + 0.125 in bleed, and
  height is trim height + 0.25 in. Spine width is page count times 0.002252 in for white paper,
  0.0025 in for cream, 0.00235 in for groundwood and 0.002347 in for premium color. Spine text
  needs at least 79 pages, and KDP's cover calculator generates an exact template.
topic: print
key_facts:
  - { label: "Cover width", value: "Bleed + back + spine + front + bleed" }
  - { label: "Cover height", value: "Bleed + trim height + bleed" }
  - { label: "Bleed", value: "0.125 in (3.2 mm) per edge" }
  - { label: "Spine, white paper", value: "Pages x 0.002252 in (0.0572 mm)" }
  - { label: "Spine, cream paper", value: "Pages x 0.0025 in (0.0635 mm)" }
  - { label: "Spine, groundwood paper", value: "Pages x 0.00235 in (0.0596 mm)" }
  - { label: "Spine, premium color", value: "Pages x 0.002347 in (0.0596 mm)" }
  - { label: "Spine text minimum", value: "79 pages (80 in Cover Creator)" }
faq:
  - q: "What file does KDP want for the cover?"
    a: "One PDF containing back cover, spine and front cover as a single image, at 300 DPI or higher. Files over 650 MB won't convert, and KDP recommends 40 MB or less."
  - q: "Does switching a paperback to groundwood paper change the cover?"
    a: "It can. KDP says books over 350 pages on cream or 525 pages on white need a spine adjustment when moving to groundwood; check the cover calculator."
  - q: "Is a hardcover cover calculated the same way?"
    a: "No. Hardcover covers use a 0.51 in (15 mm) wrap around the case board and a 0.4 in (10 mm) hinge, so KDP points hardcover authors to the cover calculator and template generator."
related_tools: [amazon-kdp, canva]
status: published
verified_at: 2026-11-09
sources:
  - https://kdp.amazon.com/en_US/help/topic/G201953020
  - https://kdp.amazon.com/en_US/help/topic/G201857950
  - https://kdp.amazon.com/en_US/cover-calculator
  - https://kdp.amazon.com/en_US/help/topic/GDTKFJPNQCBTMRV6
---

## The formulas

KDP's paperback cover is one continuous file with back cover, spine and front cover side by side, plus bleed on the outside edges:

- Cover width = 0.125 in + trim width + spine width + trim width + 0.125 in
- Cover height = 0.125 in + trim height + 0.125 in

Spine width is page count multiplied by the paper's thickness: 0.002252 in for white, 0.0025 in for cream, 0.00235 in for groundwood and 0.002347 in for premium color.

## Worked example

A 300-page 6 x 9 in paperback on white paper:

- Spine: 300 × 0.002252 in = 0.6756 in
- Width: 0.125 + 6 + 0.6756 + 6 + 0.125 = 12.9256 in
- Height: 0.125 + 9 + 0.125 = 9.25 in

On cream paper the spine becomes 300 × 0.0025 = 0.75 in and the cover 13 in wide. Paper choice changes the cover, so set ink and paper before designing.

## Spine text

KDP only prints spine text on books with at least 79 pages; Cover Creator needs 80. A shorter book with spine text is rejected. Keep at least 0.0625 in (1.6 mm) between spine text and each spine edge, because binding can shift.

## Use the cover calculator

KDP's cover calculator and template generator takes ink, paper, trim size and page count and produces a template showing full cover, safe areas, spine and barcode area. It is the safest source when KDP's pages disagree: the Create a Paperback Cover page lists standard color at 0.002252 in per page while the Paperback Submission Guidelines give one color figure of 0.002347 in.

## Common mistakes

- Designing for the wrong page count. Final page count is rounded up to an even number.
- Keeping text closer than 0.125 in to the trim lines.
- Leaving important art where KDP places its barcode if you do not supply one.

Amazon changes these rules; the linked KDP help pages are the authority.
