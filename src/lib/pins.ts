// "My tools": pinned calculators, directory tools and the visitor's own links, kept in localStorage only.
// Nothing here is sent anywhere; there is no account and no cookie.
export type PinKind = 'calc' | 'tool' | 'link';
export interface Pin {
  kind: PinKind;
  id: string;
  name: string;
  href: string;
}

const KEY = 'kdp123.pins';
const PREF = 'kdp123.open';
export const MAX_LINKS = 12;
export const MAX_PINS = 40;

export function readPins(): Pin[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter(valid).slice(0, MAX_PINS) : [];
  } catch {
    return [];
  }
}

export function writePins(pins: Pin[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(pins.filter(valid).slice(0, MAX_PINS)));
  } catch {}
  window.dispatchEvent(new CustomEvent('pins-change'));
}

/** Only same-site paths for calculators and tools, and only https links for custom ones. */
export function valid(p: unknown): p is Pin {
  if (!p || typeof p !== 'object') return false;
  const x = p as Pin;
  if (!['calc', 'tool', 'link'].includes(x.kind) || typeof x.id !== 'string' || typeof x.name !== 'string' || typeof x.href !== 'string') return false;
  if (x.name.length > 80 || x.href.length > 500) return false;
  if (x.kind === 'link') return safeLink(x.href) !== undefined;
  return /^\/[a-z0-9/_-]*\/$/.test(x.href);
}

export function safeLink(href: string): string | undefined {
  try {
    const u = new URL(href.trim());
    return u.protocol === 'https:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}

export const isPinned = (kind: PinKind, id: string) => readPins().some((p) => p.kind === kind && p.id === id);

export function togglePin(pin: Pin): boolean {
  const pins = readPins();
  const at = pins.findIndex((p) => p.kind === pin.kind && p.id === pin.id);
  if (at >= 0) pins.splice(at, 1);
  else pins.push(pin);
  writePins(pins);
  return at < 0;
}

export function addLink(name: string, href: string): string | undefined {
  const url = safeLink(href);
  if (!url) return 'Use a full https:// address.';
  const pins = readPins();
  if (pins.filter((p) => p.kind === 'link').length >= MAX_LINKS) return `Up to ${MAX_LINKS} links. Remove one first.`;
  const label = (name.trim() || new URL(url).hostname.replace(/^www\./, '')).slice(0, 80);
  pins.push({ kind: 'link', id: `l${Date.now().toString(36)}`, name: label, href: url });
  writePins(pins);
}

export function movePin(i: number, by: -1 | 1) {
  const pins = readPins();
  const j = i + by;
  if (j < 0 || j >= pins.length) return;
  [pins[i], pins[j]] = [pins[j], pins[i]];
  writePins(pins);
}

export function importPins(json: string): string | undefined {
  try {
    const v = JSON.parse(json);
    const list = (Array.isArray(v) ? v : v?.pins) as unknown[];
    if (!Array.isArray(list)) return 'That file is not a KDP123 export.';
    const pins = list.filter(valid);
    if (!pins.length) return 'No valid entries in that file.';
    writePins(pins);
  } catch {
    return 'That file is not valid JSON.';
  }
}

export const exportPins = () => JSON.stringify({ app: 'kdp123', version: 1, exported: new Date().toISOString(), pins: readPins() }, null, 2);

/** Whether directory cards open the vendor's site (default) or our details page first. */
export function openPref(): 'site' | 'details' {
  try {
    return localStorage.getItem(PREF) === 'details' ? 'details' : 'site';
  } catch {
    return 'site';
  }
}
export function setOpenPref(v: 'site' | 'details') {
  try {
    localStorage.setItem(PREF, v);
  } catch {}
  window.dispatchEvent(new CustomEvent('open-pref-change'));
}
