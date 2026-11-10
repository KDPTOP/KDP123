export interface TocItem {
  id: string;
  /** Inner HTML of the heading with tags stripped; entities stay encoded. */
  label: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'section';

/** Give every <h2> in rendered HTML an id (keeping existing ones) and list them for an "On this page" outline. */
export function outline(html: string): { html: string; toc: TocItem[] } {
  const used = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const toc: TocItem[] = [];
  const out = html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g, (_, attrs: string, inner: string) => {
    const label = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    let id = attrs.match(/\bid="([^"]+)"/)?.[1];
    if (!id) {
      const base = slugify(label);
      id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      attrs += ` id="${id}"`;
    }
    if (label) toc.push({ id, label });
    return `<h2${attrs}>${inner}</h2>`;
  });
  return { html: out, toc };
}
