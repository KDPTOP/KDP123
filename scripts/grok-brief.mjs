// Writes the verification brief for an outside researcher (e.g. the Grok bot): which tools to check, what each field
// means, the evidence rules and the exact output format that scripts/import-kdp-fit.mjs accepts.
//   node scripts/grok-brief.mjs [output.md]      default: ~/Downloads/KDP123_Grok核实任务说明.md
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';

const out = process.argv[2] ?? join(homedir(), 'Downloads', 'KDP123_Grok核实任务说明.md');
const MAKES_FILES = ['cover-design', 'writing-formatting', 'low-content', 'ai-tools'];
const BATCH = 15;

const tools = readdirSync('data/tools')
  .filter((f) => f.endsWith('.yml'))
  .map((f) => ({ id: f.replace(/\.yml$/, ''), ...parse(readFileSync(`data/tools/${f}`, 'utf8')) }))
  .filter((t) => t.status === 'published')
  .sort((a, b) => a.id.localeCompare(b.id));

const fitTools = tools.filter((t) => t.categories.some((c) => MAKES_FILES.includes(c)));
const otherTools = tools.filter((t) => !fitTools.includes(t));
const subscription = (t) => ['subscription', 'freemium'].includes(t.pricing?.model);

function table(list, start) {
  const rows = list.map((t, i) => {
    const todo = [
      fitTools.includes(t) ? 'kdp_fit' : null,
      'best_for',
      'not_ideal_for',
      subscription(t) ? 'annual_from/per/trial_days' : null,
      'region_note',
    ].filter(Boolean);
    return `| ${start + i} | \`${t.id}\` | ${t.name} | ${t.url} | ${t.categories.join(', ')} | ${todo.join(', ')} |`;
  });
  return ['| # | id | 名称 | 官网 | 类目 | 要查的字段 |', '|---|---|---|---|---|---|', ...rows].join('\n');
}

function batches(list, label, offset) {
  const parts = [];
  for (let i = 0; i < list.length; i += BATCH) {
    const n = Math.floor(i / BATCH) + 1;
    parts.push(`### ${label}${n}（${i + 1} 到 ${Math.min(i + BATCH, list.length)}）\n\n${table(list.slice(i, i + BATCH), offset + i + 1)}`);
  }
  return parts.join('\n\n');
}

const example = {
  id: 'canva',
  checked_at: '2026-11-12',
  kdp_fit: {
    cover: { level: 'manual', source: 'https://www.canva.com/help/...', evidence: 'verbatim sentence copied from that page' },
    interior: { level: 'manual', source: 'https://www.canva.com/...', evidence: '...' },
    ebook: { level: 'na', source: 'https://www.canva.com/...', evidence: '...' },
    print: { level: 'manual', source: 'https://www.canva.com/help/...', evidence: '...' },
  },
  manual_steps: [{ text: 'Enter the full-wrap cover size from KDP’s cover calculator, including spine width', source: 'https://www.canva.com/help/...' }],
  best_for: [{ text: 'Ebook covers and simple low-content interiors on a free plan', source: 'https://www.canva.com/pricing/' }],
  not_ideal_for: [{ text: 'Print covers that need an automatic spine width', source: 'https://www.canva.com/help/...' }],
  pricing: {
    annual_from: { value: 12, currency: 'USD', source: 'https://www.canva.com/pricing/', evidence: '...' },
    per: { value: 'user', source: 'https://www.canva.com/pricing/' },
    trial_days: { value: 30, source: 'https://www.canva.com/pricing/', evidence: '...' },
    region_note: { value: 'Prices shown in local currency outside the US', source: 'https://www.canva.com/pricing/' },
  },
  notes: 'Free-form remarks for the editor. Not imported.',
};

const md = `# KDP123 工具核实任务说明（给 Grok bot）

生成日期：${new Date().toISOString().slice(0, 10)}。共 ${tools.length} 个工具：A 组 ${fitTools.length} 个会产出书稿文件，要查 KDP 适配；B 组 ${otherTools.length} 个只查适合谁、不适合谁和价格条款。

## 1. 任务是什么

kdp123.com 是一个 Amazon KDP 工具目录。每个工具页要回答：它帮我做什么、适合谁、不适合谁、实际要付多少、为什么可信。下面几个字段目前大多是空的或「未核实」，请逐个工具去**厂商自己的官网页面**核实，按第 5 节的格式输出。

## 2. 硬性规则（违反任何一条，该条结论会被导入脚本拒收）

1. **每条结论都要附一个来源 URL，而且必须是该工具官网域名下的页面**（含子域名，例如 help.canva.com）。官方 Amazon 工具可以用 amazon.com、kdp.amazon.com 的页面。评测博客、联盟文章、YouTube、Reddit、AI 生成的汇总都不算。
2. kdp_fit 的每一项和价格数字，还要附 \`evidence\`：从来源页面**原文照抄**的一句话（不翻译，不改写，30 词以内）。
3. **查不到就写 \`unverified\`，或者直接省略这个字段。** 不要猜，不要按「同类工具一般都这样」推断，不要用旧数据。
4. 价格一律用美国页面、美元、税前价。看不到美国价格就不填，把情况写进 region_note。
5. 输出的文字值用**英文**（网站是英文站），简短、具体、名词短语开头，不用营销词（best、ultimate、powerful 之类）。
6. 不要编造 URL。每个 URL 都必须是你实际打开过的页面。

## 3. 字段定义

### 3.1 kdp_fit（只有 A 组要查）

按四种 KDP 输出分别判断，每项取一个值：

| 值 | 含义 | 判断标准 |
|---|---|---|
| \`native\` | 内置 KDP 预设 | 官网明确写了 KDP / Kindle Direct Publishing / Amazon KDP 的模板、预设或导出选项，用户不用自己输入 KDP 规格 |
| \`manual\` | 能做，但要手动设置 | 能做出这种文件，但尺寸、出血、书脊、边距要用户自己按 KDP 规格输入 |
| \`na\` | 不做这个 | 工具根本不产出这种文件（例如 AI 绘图工具不做内页排版） |
| \`unverified\` | 查不到 | 官网没有足够信息判断 |

四种输出：

| 字段 | 指什么 | native 的例子 | manual 的例子 |
|---|---|---|---|
| \`cover\` | 封面：电子书封面图，或纸书/精装的整张展开封面（含书脊和出血） | 输入页数和纸张后自动算书脊宽度的 KDP 封面模板 | 只能自定义画布尺寸，书脊宽度要自己算 |
| \`interior\` | 纸书内页排版：KDP 开本、页边距、装订线、出血 | 有 KDP 开本预设（如 6x9）和对应边距 | 能设页面尺寸和边距，但没有 KDP 预设 |
| \`ebook\` | Kindle 电子书文件：EPUB、KPF 或 DOCX，KDP 能接收 | 官网写明导出 Kindle/KDP 可用的 EPUB 或 KPF | 能导出 EPUB 但没提 Kindle，或要第三方转换 |
| \`print\` | 印刷 PDF：符合 KDP 印刷要求（页面尺寸、字体嵌入、300 DPI 图片） | 官网写明导出 print-ready / KDP-ready PDF | 能导出 PDF，但不保证符合印刷要求 |

另附 \`manual_steps\`：用户还要自己做的事，每条一句英文，例如 "Enter trim size, bleed and spine width from KDP's cover calculator"，同样要附来源。

### 3.2 best_for 和 not_ideal_for（A、B 两组都查）

- \`best_for\`：最适合的人或场景，1 到 3 条，每条不超过 90 个字符。
- \`not_ideal_for\`：不适合的人或场景，1 到 3 条。要基于官网上的事实，例如「只支持 Windows」可以写成 "Mac users (Windows only)"，「只支持英文」可以写成 "Books in languages other than English"。
- 每条都要附支持它的官网页面。

### 3.3 价格条款（订阅制和免费层工具查，表里会标出）

| 字段 | 含义 | 注意 |
|---|---|---|
| \`annual_from\` | 按年付费时，最低一档折算成每月多少钱 | 例如年付 $144 写 12；附 evidence |
| \`per\` | 计价单位：\`user\`（按人）、\`team\`（按团队）、\`book\`（按书） | 只用这三个值 |
| \`trial_days\` | 免费试用天数 | 只填整数；「免费层」不算试用；附 evidence |
| \`region_note\` | 价格因国家、增值税或币种不同的说明 | 一句英文 |

## 4. 工作方式

- 按批次做，每批 ${BATCH} 个工具，每批输出一个 \`.jsonl\` 文件，文件名用批次号，例如 \`A1.jsonl\`。
- 每个工具先看官网首页、功能页、定价页、帮助中心或 FAQ。帮助中心里搜 "KDP"、"Kindle"、"Amazon"、"trim"、"bleed"、"spine"、"EPUB"、"PDF/X"。
- 一个工具查不到任何信息，也要输出一行，只写 \`id\`、\`checked_at\` 和 \`notes\`，说明查了哪些页面。

## 5. 输出格式（JSON Lines：每行一个工具，一个完整的 JSON 对象，不要换行，不要加注释或代码块）

字段都可以省略；省略等于「未核实」。下面是格式示例（为了好读做了换行，实际输出要压成一行；内容是虚构的，不能照抄）：

\`\`\`json
${JSON.stringify(example, null, 2)}
\`\`\`

字段说明：
- \`id\`：必须和下表里的 id 完全一致。
- \`checked_at\`：你核实的日期，YYYY-MM-DD。
- kdp_fit 每项：\`level\`、\`source\`、\`evidence\`。
- best_for、not_ideal_for、manual_steps：数组，每个元素有 \`text\` 和 \`source\`。
- pricing 每项：\`value\`、\`source\`，annual_from 和 trial_days 另要 \`evidence\`，annual_from 要 \`currency\`。
- \`notes\`：给编辑看的备注，例如「价格页需要登录才能看到」。不会被导入。

## 6. 交付以后

把所有 \`.jsonl\` 文件交回来，编辑会运行：

\`\`\`
node scripts/import-kdp-fit.mjs A1.jsonl            # 先试运行，看哪些会被拒收
node scripts/import-kdp-fit.mjs A1.jsonl --write    # 确认后写入
\`\`\`

来源不在官网域名、缺 evidence、取值不合法的条目会被拒收并列出原因，其余写入工具数据，并记进更新日志。

## 7. A 组：会产出书稿文件的工具（${fitTools.length} 个，查 kdp_fit 和其他字段）

${batches(fitTools, 'A', 0)}

## 8. B 组：其他工具（${otherTools.length} 个，查 best_for、not_ideal_for 和价格条款）

${batches(otherTools, 'B', fitTools.length)}

## 9. C 组：免费计算器要用的 KDP 规则数字（2 项）

这组不查工具，只查 Amazon 自己的页面。**来源只能是 kdp.amazon.com 或 amazon.com 下的页面**，evidence 照抄原文。查不到就写 \`unverified\`，计算器会继续让用户自己填。输出一个 \`C.jsonl\`，每项一行：

| # | key | 要查什么 | 用在哪里 |
|---|---|---|---|
| C1 | \`kenp_rate\` | 最近 6 个月 Amazon.com 每月公布的 KENP 单价（美元每页），以及当月 KDP Select Global Fund 总额。通常在次月 15 日前后公布 | KENP 计算器默认单价（data/kenp-rates.yml） |
| C2 | \`keyword_slot_chars\` | KDP 填写图书详情时，7 个关键词框每个框最多能填多少个字符（或字节），以及是否包含空格 | 关键词组合工具的「每格字符上限」默认值 |

输出格式（每行一个 JSON 对象）：

\`\`\`json
{"key":"kenp_rate","month":"2026-09","value":0.0045,"fund_usd":60000000,"source":"https://kdp.amazon.com/...","evidence":"verbatim sentence","checked_at":"2026-11-12"}
{"key":"keyword_slot_chars","value":50,"unit":"characters","includes_spaces":true,"source":"https://kdp.amazon.com/...","evidence":"verbatim sentence","checked_at":"2026-11-12"}
\`\`\`

C1 每个月一行。上面的数字是虚构的格式示例，不能照抄。C 组由编辑手动写入 data/kenp-rates.yml 和关键词工具，不经过导入脚本。
`;

writeFileSync(out, md);
console.log(`brief: ${out} (${fitTools.length} with kdp_fit, ${otherTools.length} others)`);
