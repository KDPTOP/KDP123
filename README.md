# kdp123

The reference directory for Amazon KDP publishers: verified tools, official sources and communities, each with its price,
what it does for KDP, sources, and the date it was last checked. Live at [kdp123.com](https://kdp123.com).

- **Data**: one YAML file per listing in [`data/tools/`](data/tools), licensed [CC BY 4.0](LICENSE-DATA).
- **Site**: [Astro](https://astro.build) + Tailwind, fully static, code licensed [MIT](LICENSE).
- **Outputs** generated from the same data on every build: the website, `tools.json`, `tools.csv`, `llms.txt`,
  `llms-full.txt`, and a plain-text `.md` version of each listing page.

Not affiliated with Amazon. "Amazon", "Kindle" and "KDP" are trademarks of Amazon.com, Inc.

## Contribute

Suggest a listing or a correction by opening an issue (use the forms) or a pull request that adds or edits one file in
`data/tools/`. Read [CONTRIBUTING.md](CONTRIBUTING.md) first: every change needs a source, and listing cannot be bought.

## A listing

```yaml
name: Publisher Rocket
url: https://publisherrocket.com
categories: [book-research, keywords-categories]
tagline: One sentence that can be quoted on its own.
summary: >-
  Two or three factual sentences. No hype.
pricing: { model: one-time, from: 199, currency: USD, period: one-time, refund_days: 30 }
platforms: [windows, mac]
kdp:
  marketplaces: [us, ca, uk, de, fr, es, it, au]
  outputs_kdp_files: false
  touches_kdp_account: false
status: published        # draft entries are not built
verified_at: 2026-11-09  # the day a person checked it against the sources
sources:
  - https://example.com/pricing
```

The schema is in [`src/content.config.ts`](src/content.config.ts) and categories are in
[`src/lib/taxonomy.ts`](src/lib/taxonomy.ts). A published listing must have `verified_at` and at least one source.
`npm run build` fails if a file does not match the schema.

## Develop

Needs Node 22.23.4 or newer.

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # type and schema check
npm run build      # static site in dist/
npm run links      # check that every listing URL still answers (add -- --sources for sources)
```

Monthly jobs:

- `node scripts/monthly-report.mjs [YYYY-MM]` writes `data/reports/YYYY-MM.json`. The `monthly-report` workflow runs it on the 1st and opens a draft PR.
- `RESEND_API_KEY=... node scripts/newsletter-draft.mjs [YYYY-MM]` turns a merged report into a Resend broadcast draft. It never sends; review and send from the Resend dashboard. Without the key it writes the HTML and text locally.
- The `geo-check` workflow opens a checklist issue on the 2nd from `data/geo/prompts.yml`; record the answers in `data/geo/log.csv`.

The forms behind `/api/suggest` and `/api/subscribe` are Cloudflare Workers in `workers/`. Their secrets live only in Cloudflare.

## Affiliate links

This repository never contains affiliate URLs, and affiliate status never affects text or order. If the maintainers use
affiliate links, they live in an untracked `affiliates.private.json` (`{ "<slug>": "<url>" }`) on the build machine. A
tool with an entry there is linked through `/go/<slug>/` with `rel="sponsored nofollow"` and an "Affiliate link" label on
its page. Without that file, every outbound link goes straight to the official URL.

## Disclosure

kdp123 is made by the team behind [KDPTop](https://kdptop.com). KDPTop is listed like any other tool, labelled, and held
to the same fields. See the [methodology](https://kdp123.com/methodology/).

## Cite

Data from kdp123.com, CC BY 4.0. See [CITATION.cff](CITATION.cff).
