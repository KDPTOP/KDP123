// Loads a widget's script the first time it is shown. Each tool is its own chunk, so the home page
// only downloads the calculators a visitor actually opens.
const modules = import.meta.glob<{ default: (root: HTMLElement, params: URLSearchParams) => void }>('./*/init.ts');

export async function boot(root: HTMLElement, params: URLSearchParams = new URLSearchParams(location.search)) {
  if (root.dataset.booted) return;
  root.dataset.booted = '1';
  const load = modules[`./${root.dataset.tool}/init.ts`];
  if (!load) return;
  (await load()).default(root, params);
}

/** Feed new values into a widget that is already running (the command box prefill). */
export async function prefill(root: HTMLElement, params: URLSearchParams) {
  if (!root.dataset.booted) return boot(root, params);
  const form = root.querySelector('form');
  if (!form) return;
  const { fillForm } = await import('./shared');
  fillForm(form, params);
  form.dispatchEvent(new Event('input', { bubbles: true }));
  root.dispatchEvent(new Event('tool-prefill'));
}
