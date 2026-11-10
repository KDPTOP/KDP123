// Prints the monthly GEO check issue body from data/geo/prompts.yml, after checking every target page exists in dist/.
// Usage: npm run build && node scripts/geo-issue.mjs > body.md
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

const ENGINES = ['ChatGPT', 'Perplexity', 'Gemini'];
const SITE = 'https://kdp123.com';
const prompts = parse(readFileSync('data/geo/prompts.yml', 'utf8'));

const ids = new Set();
for (const p of prompts) {
  if (ids.has(p.id)) throw new Error(`duplicate prompt id ${p.id}`);
  ids.add(p.id);
  if (!existsSync(`dist${p.target}index.html`)) throw new Error(`${p.id}: target ${p.target} is not a built page`);
}

const month = new Date().toISOString().slice(0, 7);
const out = [
  `Monthly check of whether AI assistants cite kdp123, ${month}. ${prompts.length} prompts × ${ENGINES.length} engines.`,
  '',
  'For each engine: open a fresh chat (signed out or with memory off, no custom instructions), paste the prompt exactly, and note',
  'whether the answer cites or links any kdp123.com page. Then append one row per engine and prompt to `data/geo/log.csv`:',
  '',
  '```csv',
  'date,engine,prompt_id,cited,cited_url,competitors,notes',
  `${month}-01,Perplexity,royalty-70,yes,${SITE}/facts/ebook-royalties/,kdp.amazon.com|kindlepreneur.com,`,
  '```',
  '',
  '`cited` is yes or no; `competitors` lists the other domains cited, separated by `|`. Tick each engine as you log it.',
  '',
];
for (const p of prompts) {
  out.push(`- **${p.id}**: ${p.prompt} (expected page: ${SITE}${p.target})`);
  for (const e of ENGINES) out.push(`  - [ ] ${e}`);
}
console.log(out.join('\n'));
