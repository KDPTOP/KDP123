import { checkDescription, formatDescription, ALLOWED_TAGS, DESCRIPTION_MAX } from '../../lib/calc/listing';
import { $, $$, bindForm, copyText, notes } from '../shared';

export default function init(root: HTMLElement, params: URLSearchParams) {
  const form = $<HTMLFormElement>(root, 'form');
  const input = $<HTMLTextAreaElement>(root, '[data-el="in"]');
  const htmlOut = $<HTMLTextAreaElement>(root, '[data-el="html"]');
  const preview = $(root, '[data-el="preview"]');
  const issuesEl = $(root, '[data-el="issues"]');
  const count = $(root, '[data-el="count"]');
  const bar = $(root, '[data-el="bar"]');
  const mode = () => (new FormData(form).get('mode') as string) ?? 'text';

  // Preview renders only the tags KDP supports, with every attribute dropped.
  function safePreview(html: string) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walk = (node: Node, into: Node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) into.appendChild(document.createTextNode(child.textContent ?? ''));
        else if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = (child as Element).tagName.toLowerCase();
          if (ALLOWED_TAGS.includes(tag)) walk(child, into.appendChild(document.createElement(tag)));
          else walk(child, into);
        }
      }
    };
    const frag = document.createDocumentFragment();
    walk(doc.body, frag);
    preview.replaceChildren(frag);
  }

  function run() {
    const html = mode() === 'text' ? formatDescription(input.value) : input.value;
    $$(root, '[data-mode="text"]').forEach((el) => (el.hidden = mode() !== 'text'));
    htmlOut.value = html;
    const r = checkDescription(html);
    count.textContent = r.length.toLocaleString('en-US');
    bar.style.width = `${Math.min(100, (r.length / DESCRIPTION_MAX) * 100)}%`;
    bar.className = `h-full transition-all ${r.length > DESCRIPTION_MAX ? 'bg-bad' : 'bg-brand'}`;
    notes(issuesEl, r.issues.length ? r.issues.map((i) => [i.level === 'error' ? 'issue-error' : 'issue-warn', i.text]) : [['issue-ok', 'No problems found.']]);
    safePreview(html);
  }

  const copy = $<HTMLButtonElement>(root, '[data-el="copy"]');
  copy.addEventListener('click', () => copyText(copy, htmlOut.value, 'Copy HTML'));
  bindForm(root, form, params, run);
}
