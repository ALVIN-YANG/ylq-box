/**
 * Model Arena 仪表盘生成脚本
 *
 * 数据源：
 *   1. lmarena.ai — Arena 排名（RSC payload 解析）
 *   2. model-pricing.json — API 定价（手动维护）
 *   3. model-domestic.json — 国内模型榜单与来源（手动维护）
 *   4. aiflashreport.com — 模型发布时间线（自动抓取）
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

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
};

async function fetchWithRetry(url, options = {}, retries = 3, baseDelayMs = 2000) {
  let lastError = new Error(`Failed after ${retries} attempts`);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...BROWSER_HEADERS, ...options.headers },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`  ⚠ Attempt ${attempt} failed (${err.message}), retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
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

  for (const cat of ['text', 'code', 'vision']) {
    const seen = new Map();
    results[cat].forEach(e => {
      if (!seen.has(e.name) || seen.get(e.name).rating < e.rating) seen.set(e.name, e);
    });
    results[cat] = [...seen.values()].sort((a, b) => b.rating - a.rating);
  }

  return results;
}

async function fetchArenaRankings(existingData = null) {
  console.log('\n── LMArena Rankings ──');

  const urls = [
    'https://llmarena.ai/leaderboard',
    'https://lmarena.ai/leaderboard',
    'https://chat.lmarena.ai/leaderboard',
  ];

  let lastError = null;
  for (const url of urls) {
    try {
      console.log(`  → Trying ${url}`);
      const res = await fetchWithRetry(url, { headers: { Accept: 'text/html' } }, 2, 3000);
      const html = await res.text();
      const data = parseArenaData(html);
      if (data.text.length > 0 || data.code.length > 0 || data.vision.length > 0) {
        console.log(`  ✓ Text: ${data.text.length}, Code: ${data.code.length}, Vision: ${data.vision.length}`);
        return data;
      } else {
        console.warn(`  ✗ ${url}: parsed 0 entries, trying next URL`);
      }
    } catch (err) {
      lastError = err;
      console.warn(`  ✗ ${url}: ${err.message}`);
    }
  }

  if (existingData?.arena) {
    console.warn(`  ↩ All LMArena URLs failed, preserving existing arena data (Text: ${existingData.arena.text?.length || 0}, Code: ${existingData.arena.code?.length || 0}, Vision: ${existingData.arena.vision?.length || 0})`);
    return existingData.arena;
  }

  console.warn(`  ✗ All LMArena fetch attempts failed, using empty data`);
  return { text: [], code: [], vision: [] };
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
// 模块 3: AI Flash Report 模型发布时间线抓取
// ─────────────────────────────────────────────

function parseReleaseCards(html) {
  const releases = [];

  const cardSplits = html.split('<div class="release-card"');
  for (let i = 1; i < cardSplits.length; i++) {
    const card = cardSplits[i];
    const endIdx = card.indexOf('<div class="release-card"');
    const chunk = endIdx > -1 ? card.slice(0, endIdx) : card;

    const company = chunk.match(/data-company="([^"]+)"/)?.[1]?.trim() || '';
    const type = chunk.match(/data-type="([^"]+)"/)?.[1]?.trim() || '';
    const category = chunk.match(/data-category="([^"]+)"/)?.[1]?.trim() || '';
    const title = chunk.match(/release-title">([^<]+)/)?.[1]?.trim() || '';
    const orgText = chunk.match(/release-company">([^<]+)/)?.[1]?.trim() || company;
    const date = chunk.match(/<strong>Released:<\/strong>\s*(\d{4}-\d{2}-\d{2})/)?.[1] || '';
    const description = chunk.match(/release-description">([^<]+)/)?.[1]?.trim() || '';

    const features = [];
    const featureMatches = chunk.matchAll(/<li>([^<]+)<\/li>/g);
    for (const fm of featureMatches) features.push(fm[1].trim());

    const metrics = [];
    const metricPairs = chunk.matchAll(/<div class="metric-value">([^<]+)<\/div>\s*<div class="metric-name">([^<]+)<\/div>/g);
    for (const mp of metricPairs) {
      metrics.push({ name: mp[2].trim(), value: mp[1].trim() });
    }

    const announcementUrl = chunk.match(/announcement-link"\s*[^>]*href="([^"]+)"/)?.[1] || '';

    if (!title || !date) continue;

    const highlights = buildHighlights(description, features, metrics);

    releases.push({
      date,
      model: title,
      provider: orgText,
      type,
      category,
      highlights,
      features: features.slice(0, 4),
      metrics: metrics.slice(0, 3),
      url: announcementUrl,
    });
  }

  return releases.sort((a, b) => b.date.localeCompare(a.date));
}

function buildHighlights(description, features, metrics) {
  const parts = [];
  if (description) parts.push(description);

  const metricsStr = metrics.slice(0, 2)
    .map(m => `${m.name} ${m.value}`)
    .join('，');
  if (metricsStr) parts.push(metricsStr);

  if (parts.length === 0 && features.length > 0) {
    parts.push(features.slice(0, 3).join('；'));
  }

  return parts.join('。') || '';
}

async function fetchModelReleases() {
  console.log('\n── AI Flash Report (Model Releases) ──');
  try {
    const res = await fetchWithRetry('https://aiflashreport.com/model-releases', {
      headers: { Accept: 'text/html' },
    }, 2, 2000);
    const html = await res.text();
    const releases = parseReleaseCards(html);
    console.log(`  ✓ ${releases.length} releases parsed`);
    return releases;
  } catch (err) {
    console.warn(`  ✗ AI Flash Report: ${err.message}`);
    console.log('  ↩ Falling back to local model-releases.json');
    return loadJSON('model-releases.json');
  }
}

// ─────────────────────────────────────────────
// JSON 数据输出
// ─────────────────────────────────────────────

function buildOutput(arena, pricing, releases, timestamp) {
  const domestic = loadJSON('model-domestic.json');

  return {
    updatedAt: timestamp.cn,
    updatedAtISO: timestamp.iso,
    sources: {
      arena: {
        label: 'LMArena Leaderboard',
        url: 'https://lmarena.ai/leaderboard',
      },
      pricing: {
        label: '站内定价数据',
        url: 'https://github.com/ALVIN-YANG/ylqMemoryBackup/blob/main/scripts/model-pricing.json',
      },
      releases: {
        label: 'AI Flash Report',
        url: 'https://aiflashreport.com/model-releases',
      },
      domestic: domestic.source || {
        label: '站内维护数据',
        url: 'https://github.com/ALVIN-YANG/ylqMemoryBackup/blob/main/scripts/model-domestic.json',
      },
    },
    arena: {
      text: arena.text.slice(0, 20),
      code: arena.code.slice(0, 15),
      vision: arena.vision.slice(0, 15),
    },
    domestic: {
      updatedAt: timestamp.cn,
      note: domestic.note || '',
      source: domestic.source || null,
      categories: Object.fromEntries(
        Object.entries(domestic.categories || {}).map(([key, value]) => [
          key,
          {
            source: value.source || domestic.source || null,
            items: Array.isArray(value.items) ? value.items : [],
          },
        ])
      ),
    },
    pricing: [...pricing].sort((a, b) => a.input - b.input),
    releases: releases.slice(0, 40),
  };
}

// ─────────────────────────────────────────────
// 入口
// ─────────────────────────────────────────────

async function main() {
  const force = process.argv.includes('--force');
  const outputPath = join(process.cwd(), OUTPUT_PATH);

  console.log('🏟️ 生成 Model Arena 仪表盘...');

  const timestamp = getTimestamp();
  const existing = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, 'utf-8')) : null;

  console.log('\n── Loading JSON configs ──');
  const pricing = loadJSON('model-pricing.json');
  console.log(`  ✓ Pricing: ${pricing.length} models`);

  const [arena, releases] = await Promise.all([
    fetchArenaRankings(existing),
    fetchModelReleases(),
  ]);

  const data = buildOutput(arena, pricing, releases, timestamp);

  if (!force && existing && existing.updatedAtISO === data.updatedAtISO) {
    console.log('\n⏭ 数据未变化，跳过写入');
    return;
  }

  writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ 已生成 ${OUTPUT_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1); });
