import { execFileSync } from 'node:child_process';

let cache: Map<string, Date> | undefined;

/** Date each data/tools file was first committed. Files not yet committed count as added now. */
export function addedDates(): Map<string, Date> {
  if (cache) return cache;
  cache = new Map();
  try {
    const log = execFileSync('git', ['log', '--diff-filter=A', '--name-only', '--format=%x00%cI', '--', 'data/tools'], { encoding: 'utf8' });
    for (const block of log.split('\0').filter(Boolean)) {
      const [date, ...files] = block.trim().split('\n');
      for (const f of files) {
        const m = f.match(/^data\/tools\/(.+)\.yml$/);
        // git log runs newest first; keep the oldest add in case a file was deleted and re-added.
        if (m) cache.set(m[1], new Date(date));
      }
    }
  } catch {
    // Not a git checkout (e.g. a source tarball): fall back to verified_at ordering.
  }
  return cache;
}
