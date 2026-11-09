---
title: "KDP book description rules: 4,000 characters and supported HTML"
question: "How long can a KDP book description be, and what HTML and content are allowed?"
answer: >-
  A KDP book description can be up to 4,000 characters, and HTML tags count toward that limit.
  Supported tags are br, p, b, em, i, u, h4 to h6, ol, ul and li; h1 to h3 are not supported.
  Descriptions cannot include contact details or URLs, reviews or testimonials, review requests,
  pricing or promotions, time-sensitive information, spoilers, keyword lists or Unicode emojis.
topic: metadata
key_facts:
  - { label: "Length limit", value: "4,000 characters, HTML tags included" }
  - { label: "Supported HTML", value: "<br>, <p>, <b>, <em>, <i>, <u>, <h4>-<h6>, <ol>, <ul>, <li>" }
  - { label: "Unsupported headings", value: "<h1>, <h2>, <h3>" }
  - { label: "Suggested length", value: "A 150-word paragraph" }
  - { label: "Emojis", value: "Not allowed" }
  - { label: "Links, emails, phone numbers", value: "Not allowed" }
faq:
  - q: "Can I put editorial reviews or blurbs in my description?"
    a: "No. Reviews, quotes and testimonials are on KDP's list of content it cannot accept in the description. Amazon points authors to Author Central for editorial reviews."
  - q: "Why do I get a 'Description may not contain invisible characters' error?"
    a: "Hidden or unsupported characters were usually copied in from another document. Retype the text or check the Source view against the supported tags."
  - q: "How do I add an empty line between paragraphs?"
    a: "Use two line breaks, <br><br>, or wrap paragraphs in <p></p>. Double spaces between words are not shown on the detail page."
related_tools: [author-central, amazon-kdp]
status: published
verified_at: 2026-11-09
sources:
  - https://kdp.amazon.com/en_US/help/topic/G201189630
  - https://kdp.amazon.com/en_US/help/topic/GC4VASCGNQP6LQ7L
  - https://kdp.amazon.com/en_US/help/topic/G201097560
  - https://kdp.amazon.com/en_US/help/topic/GW7J4WEKBVU25YEC
---

## The 4,000-character limit

The Description field holds up to 4,000 characters, and the counter includes HTML tags whether you use the text editor or the Source view. Amazon's own example: "test" counts as 4 characters, but in bold it counts as 11, because `<b></b>` adds 7. A description heavy on headings and lists can therefore hold noticeably less text.

## Allowed formatting

You can format with the built-in editor or basic HTML. Supported tags are `<br>` for line breaks, `<p>` for paragraphs, `<b>` for bold, `<em>` and `<i>` for italics, `<u>` for underline, `<h4>` to `<h6>` for headings, and `<ol>` or `<ul>` with `<li>` for lists. Headings `<h1>` to `<h3>` are not supported. Every formatting tag needs both an opening and a closing tag, and stray angle brackets such as `<<` or `<>` are not allowed.

## Prohibited content

KDP cannot accept any of the following in a description:

- Pornographic, obscene or offensive content
- Phone numbers, mail addresses, email addresses or website URLs
- Reviews, quotes or testimonials, and requests for reviews
- Advertisements, watermarks or promotional material
- Time-sensitive information such as tour dates
- Availability, price or other ordering information
- Spoilers, keywords or book tag phrases, and Unicode emojis

## Special cases

A differentiated public domain edition must open its description with a bullet-point summary of what is original. A book republished under a new title must start the description with "Previously published as [book title] by [author name]."

## Common mistakes

- Pasting from a word processor, which can bring in invisible characters and stray header tags.
- Leaving a tag unclosed, which can make the rest of the description bold or italic.

Amazon changes these rules; the linked KDP help pages are the authority.
