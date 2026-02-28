/**
 * AI News 自动化脚本
 *
 * 功能：
 *   --daily   抓取 RSS 新闻 → LLM 总结 → 生成每日速递 .md
 *   --weekly  读取本周每日文件 → LLM 合并 → 生成每周总结 .md
 *
 * 环境变量：
 *   OPENAI_API_KEY  - OpenAI API Key（必须）
 *   OPENAI_BASE_URL - 自定义 API 地址（可选，用于代理或兼容接口）
 *   OPENAI_MODEL    - 模型名称（可选，默认 gpt-4o-mini）
 */

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DOCS_DIR = 'src/content/docs/ai-news';

const RSS_FEEDS = [
  { name: 'Hacker News AI', url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT+OR+Claude&points=50&count=20' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
];

function getGeneratedAt() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    cn: now.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    }),
  };
}

// ── RSS 解析（轻量实现，不依赖第三方库） ──

async function fetchRSS(feedUrl) {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'YLQ-Box-AI-News/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${feedUrl}`);
  return res.text();
}

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1]
      || block.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const desc = block.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/s)?.[1]
      || block.match(/<description>(.*?)<\/description>/s)?.[1] || '';
    items.push({
      title: title.replace(/<[^>]*>/g, '').trim(),
      link: link.trim(),
      pubDate,
      description: desc.replace(/<[^>]*>/g, '').trim().slice(0, 300),
    });
  }
  return items;
}

async function fetchAllNews() {
  const allItems = [];
  for (const feed of RSS_FEEDS) {
    try {
      const xml = await fetchRSS(feed.url);
      const items = parseRSSItems(xml).slice(0, 10);
      items.forEach(item => { item.source = feed.name; });
      allItems.push(...items);
      console.log(`✓ ${feed.name}: ${items.length} items`);
    } catch (err) {
      console.warn(`✗ ${feed.name}: ${err.message}`);
    }
  }
  return allItems;
}

// ── LLM 调用 ──

async function callLLM(systemPrompt, userContent) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('⚠ OPENAI_API_KEY 未设置，跳过 LLM 总结，使用原始列表');
    return null;
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`⚠ LLM API 调用失败（${res.status}），改用 RSS 原始列表。`);
      console.warn(`⚠ 失败详情：${body}`);
      console.warn('⚠ 请检查 OPENAI_BASE_URL 与 OPENAI_MODEL 是否匹配当前服务商的模型命名规则。');
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn(`⚠ LLM 调用异常：${err.message}，改用 RSS 原始列表。`);
    return null;
  }
}

// ── 每日速递 ──

async function generateDaily(force = false) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `${dateStr}-daily.md`;
  const filepath = join(DOCS_DIR, filename);
  const generatedAt = getGeneratedAt();

  if (existsSync(filepath) && !force) {
    console.log(`⏭ ${filename} 已存在，跳过`);
    return;
  }
  if (existsSync(filepath) && force) {
    console.log(`♻ ${filename} 已存在，强制覆盖`);
  }

  console.log(`\n📰 抓取 AI 新闻 (${dateStr})...\n`);
  const items = await fetchAllNews();

  if (items.length === 0) {
    console.log('没有抓取到新闻，跳过生成');
    return;
  }

  const newsText = items.map((item, i) =>
    `${i + 1}. [${item.source}] ${item.title}\n   ${item.link}\n   ${item.description}`
  ).join('\n\n');

  const SYSTEM_PROMPT = `你是一个 AI 行业新闻编辑。用户会提供今天从 RSS 抓取的原始新闻列表。
请你：
1. 筛选出最重要的 5~10 条 AI 相关新闻（去重、去无关内容）
2. 每条用一句中文标题 + 一段简短中文摘要（2~3 句话）
3. 保留原文链接
4. 按重要性排序
5. 只输出 Markdown 内容（不要 frontmatter），用 ### 作为每条新闻标题`;

  let content;
  const llmResult = await callLLM(SYSTEM_PROMPT, newsText);

  if (llmResult) {
    content = llmResult;
  } else {
    content = items.slice(0, 10).map(item =>
      `### ${item.title}\n\n${item.description}\n\n**来源**：[${item.source}](${item.link})`
    ).join('\n\n---\n\n');
  }

  const md = `---
title: "AI 速递 ${dateStr}"
description: "${dateStr} AI 行业新闻速递"
---

> 生成时间：${generatedAt.cn}（UTC: ${generatedAt.iso}）

${content}
`;

  writeFileSync(filepath, md);
  console.log(`\n✅ 已生成 ${filepath}`);
}

// ── 每周总结 ──

async function generateWeekly(force = false) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() - 6); // 上周一
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // 上周日

  const startStr = weekStart.toISOString().split('T')[0];
  const endStr = weekEnd.toISOString().split('T')[0];
  const filename = `${startStr}-weekly.md`;
  const filepath = join(DOCS_DIR, filename);
  const generatedAt = getGeneratedAt();

  if (existsSync(filepath) && !force) {
    console.log(`⏭ ${filename} 已存在，跳过`);
    return;
  }
  if (existsSync(filepath) && force) {
    console.log(`♻ ${filename} 已存在，强制覆盖`);
  }

  console.log(`\n📋 生成周报 (${startStr} ~ ${endStr})...\n`);

  const files = readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('-daily.md') && f >= startStr && f <= endStr)
    .sort();

  if (files.length === 0) {
    console.log('本周没有每日速递文件，跳过');
    return;
  }

  const dailyContents = files.map(f => {
    const raw = readFileSync(join(DOCS_DIR, f), 'utf-8');
    const body = raw.replace(/---[\s\S]*?---/, '').trim();
    return `## ${f.replace('-daily.md', '')}\n\n${body}`;
  }).join('\n\n---\n\n');

  const SYSTEM_PROMPT = `你是一个 AI 行业分析师。用户会提供一周内每天的 AI 新闻速递。
请你：
1. 合并去重，提炼出本周 AI 领域最重要的 5~8 个主题/事件
2. 每个主题写一段中文分析（3~5 句话），包含背景、影响、趋势判断
3. 最后给出一段"本周观察"总结（3~5 句话）
4. 只输出 Markdown 内容（不要 frontmatter）`;

  let content;
  const llmResult = await callLLM(SYSTEM_PROMPT, dailyContents);

  if (llmResult) {
    content = llmResult;
  } else {
    content = `> 本周自动总结未启用或调用失败，以下为原始内容合并。\n\n${dailyContents}`;
  }

  const md = `---
title: "周报 ${startStr} ~ ${endStr}"
description: "${startStr} 至 ${endStr} AI 行业周报"
---

> 生成时间：${generatedAt.cn}（UTC: ${generatedAt.iso}）

${content}
`;

  writeFileSync(filepath, md);
  console.log(`\n✅ 已生成 ${filepath}`);
}

// ── 入口 ──

const args = process.argv.slice(2);
const mode = args.find(arg => arg === '--daily' || arg === '--weekly');
const force = args.includes('--force');

if (mode === '--daily') {
  generateDaily(force).catch(err => { console.error(err); process.exit(1); });
} else if (mode === '--weekly') {
  generateWeekly(force).catch(err => { console.error(err); process.exit(1); });
} else {
  console.log(`用法：
  node scripts/fetch-ai-news.mjs --daily    生成每日速递
  node scripts/fetch-ai-news.mjs --weekly   生成每周总结
  node scripts/fetch-ai-news.mjs --daily --force    强制覆盖当日文件
  node scripts/fetch-ai-news.mjs --weekly --force   强制覆盖当周文件

环境变量：
  OPENAI_API_KEY   - OpenAI API Key（必须，用于 LLM 总结）
  OPENAI_BASE_URL  - 自定义 API 地址（可选，支持代理/兼容接口如 DeepSeek）
  OPENAI_MODEL     - 模型名称（可选，默认 gpt-4o-mini）`);
}
