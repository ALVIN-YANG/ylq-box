/**
 * Model Arena 仪表盘生成脚本
 *
 * 数据源：
 *   1. lmarena.ai — Arena 排名（RSC payload 解析）
 *   2. model-pricing.json — API 定价（手动维护）
 *   3. model-releases.json — 模型发布时间线（手动维护）
 *
 * 用法：
 *   node scripts/fetch-model-arena.mjs [--force]
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = 'src/data/model-arena.json';

function getTimestamp() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    cn: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }),
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const res = await fetch(url, {
    ...options,
    headers: { 'User-Agent': 'YLQ-Box-ModelArena/1.0', ...options.headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}

// ─────────────────────────────────────────────
// 模块 1: LMArena 排行榜（RSC payload 解析）
// ─────────────────────────────────────────────

function parseArenaData(html) {
  const pushes = html.match(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g) || [];
  let combined = '';
  pushes.forEach(p => {
    const inner = p.match(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/)?.[1] || '';
    combined += inner;
  });
  combined = combined.replace(/\\"/g, '"');

  const results = { text: [], code: [], vision: [] };

  const blocks = [];
  let pos = 0;
  while (pos < combined.length) {
    const idx = combined.indexOf('"entries":[{"rank":', pos);
    if (idx === -1) break;
    blocks.push(idx);
    pos = idx + 100;
  }

  blocks.forEach((blockStart, i) => {
    const context = combined.slice(Math.max(0, blockStart - 300), blockStart);
    const blockEnd = i + 1 < blocks.length ? blocks[i + 1] : combined.length;
    const blockText = combined.slice(blockStart, Math.min(blockStart + 60000, blockEnd));

    let category = 'unknown';
    if (i === 0 && /text|overall/i.test(context)) category = 'text';
    else if (i === 1 && /webdev|code/i.test(context)) category = 'code';
    else if (i === 2 && /vision/i.test(context)) category = 'vision';
    else if (i === 0) category = 'text';

    if (!['text', 'code', 'vision'].includes(category)) return;

    const regex = /\{"rank":(\d+),"rankUpper":\d+,"rankLower":\d+,"modelDisplayName":"([^"]+)","rating":([\d.]+),"ratingUpper":([\d.]+),"ratingLower":([\d.]+),"votes":(\d+),"modelOrganization":"([^"]*)"/g;
    let m;
    while ((m = regex.exec(blockText))) {
      results[category].push({
        rank: +m[1],
        name: m[2],
        rating: +m[3],
        ci: `${(+m[4] - +m[3]).toFixed(1)} / ${(+m[3] - +m[5]).toFixed(1)}`,
        votes: +m[6],
        org: m[7],
      });
    }
  });

  // Deduplicate each category by name, keep highest rating
  for (const cat of ['text', 'code', 'vision']) {
    const seen = new Map();
    results[cat].forEach(e => {
      if (!seen.has(e.name) || seen.get(e.name).rating < e.rating) seen.set(e.name, e);
    });
    results[cat] = [...seen.values()].sort((a, b) => b.rating - a.rating);
  }

  return results;
}

async function fetchArenaRankings() {
  console.log('\n── LMArena Rankings ──');
  try {
    const res = await fetchWithTimeout('https://llmarena.ai/leaderboard', {
      headers: { Accept: 'text/html' },
    }, 30000);
    const html = await res.text();
    const data = parseArenaData(html);
    console.log(`  ✓ Text: ${data.text.length}, Code: ${data.code.length}, Vision: ${data.vision.length}`);
    return data;
  } catch (err) {
    console.warn(`  ✗ LMArena: ${err.message}`);
    return { text: [], code: [], vision: [] };
  }
}

// ─────────────────────────────────────────────
// 模块 2: JSON 配置文件读取
// ─────────────────────────────────────────────

function loadJSON(filename) {
  const path = join(__dirname, filename);
  if (!existsSync(path)) {
    console.warn(`  ⚠ ${filename} not found`);
    return [];
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// ─────────────────────────────────────────────
// JSON 数据输出
// ─────────────────────────────────────────────

function buildOutput(arena, pricing, releases, timestamp) {
  return {
    updatedAt: timestamp.cn,
    updatedAtISO: timestamp.iso,
    arena: {
      text: arena.text.slice(0, 20),
      code: arena.code.slice(0, 15),
      vision: arena.vision.slice(0, 15),
    },
    pricing: [...pricing].sort((a, b) => a.input - b.input),
    releases: [...releases].sort((a, b) => b.date.localeCompare(a.date)),
  };
}

// ─────────────────────────────────────────────
// 入口
// ─────────────────────────────────────────────

async function main() {
  const force = process.argv.includes('--force');
  const outputPath = join(process.cwd(), OUTPUT_PATH);

  if (existsSync(outputPath) && !force) {
    console.log('⏭ model-arena/index.md 已存在，使用 --force 强制覆盖');
    return;
  }

  console.log('🏟️ 生成 Model Arena 仪表盘...');

  const timestamp = getTimestamp();

  console.log('\n── Loading JSON configs ──');
  const pricing = loadJSON('model-pricing.json');
  console.log(`  ✓ Pricing: ${pricing.length} models`);
  const releases = loadJSON('model-releases.json');
  console.log(`  ✓ Releases: ${releases.length} entries`);

  const arena = await fetchArenaRankings();

  const data = buildOutput(arena, pricing, releases, timestamp);
  writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ 已生成 ${OUTPUT_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1); });
