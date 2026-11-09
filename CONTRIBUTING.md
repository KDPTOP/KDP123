# Contributing

Thanks for helping keep the directory accurate. The rules below exist so the data stays trustworthy.

## What we accept

- New listings that are relevant to publishing on Amazon KDP and that you (or the vendor) can source.
- Corrections to prices, features, URLs, or KDP-specific attributes, with a source.
- Fixes to the site code.

## What we do not accept

- **Pay-to-list or pay-to-rank.** Listing is free. We do not take payment for placement, ordering or wording.
- **Entries without a source.** Every price and claim needs a link a reader can open.
- **LLM-generated bulk submissions.** Pull requests or issues that look machine-generated in bulk, with unverified prices
  or invented features, are closed without review. Using a model to help you draft is fine; checking the facts is on you.
- **Affiliate or tracking URLs in `data/`.** Use the official URL. Affiliate links are handled privately by maintainers.
- Promotional wording: "best", "#1", "revolutionary". Describe what it does.

## Adding or editing a listing

1. Copy an existing file in `data/tools/` and use the slug (lowercase, hyphens) as the file name.
2. Fill in the fields. See the example in the [README](README.md) and the schema in `src/content.config.ts`.
3. Set `status: published` and `verified_at` to the day **you** checked the sources. Leave it `draft` if you could not.
4. Put the pricing page or review you used under `sources`. Say in `pricing.note` when a price comes from the vendor's own page.
5. Run `npm run build` and `npm run links`. Both must pass.
6. Open a pull request. Say whether you are the vendor.

## Vendors

You may propose changes to your own listing. Say so in the pull request. We will mark it "Verified by vendor" when the
details check out. That label does not change placement.

## Conflict of interest

kdp123 is made by the team behind KDPTop. KDPTop is listed with the same fields and labelled. If you think a listing
is treated unfairly, open an issue.

## Code of conduct

Be civil. Assume good faith. Disagree about facts with sources.
