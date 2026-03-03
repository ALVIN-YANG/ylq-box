/**
 * AI News 自动化脚本 v2
 *
 * 三个数据模块：
 *   1. RSS Feeds     — 行业动态 + 技术博客
 *   2. GitHub Trending — 社区热门 AI 项目（HTML 抓取）
 *   3. Release Watch  — 可配置的项目版本追踪（GitHub API）
 *
 * 用法：
 *   node scripts/fetch-ai-news.mjs --daily [--force]
 *   node scripts/fetch-ai-news.mjs --weekly [--force]
 *
 * 环境变量：
 *   OPENAI_API_KEY  — 必须
 *   OPENAI_BASE_URL — 可选（代理/兼容接口）
 *   OPENAI_MODEL    — 可选（默认 gpt-4o-mini）
 *   GITHUB_TOKEN    — 可选（提升 API 速率限制）
 */

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = 'src/content/docs/ai-news';

// ─────────────────────────────────────────────
// 通用工具
// ─────────────────────────────────────────────

function getGeneratedAt() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    cn: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }),
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const res = await fetch(url, {
    ...options,
    headers: { 'User-Agent': 'YLQ-Box-AI-News/2.0', ...options.headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}

// ─────────────────────────────────────────────
// 模块 1: RSS Feeds
// ─────────────────────────────────────────────

const RSS_FEEDS = [
  { name: 'Hacker News AI', url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT+OR+Claude+OR+agent&points=50&count=20' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/' },
  { name: 'Cursor Changelog', url: 'https://cursor.com/changelog/rss.xml' },
];

function parseRSSItems(xml) {
  const items = [];
  // RSS <item> format
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1]
      || block.match(/<title>(.*?)<\/title>/)?.[1] || '').replace(/<[^>]*>/g, '').trim();
    const link = (block.match(/<link>(.*?)<\/link>/)?.[1] || '').trim();
    const desc = (block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1]
      || block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '')
      .replace(/<[^>]*>/g, '').trim().slice(0, 300);
    if (title) items.push({ title, link, description: desc });
  }
  // Atom <entry> format (for Simon Willison, HuggingFace)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title[^>]*>(.*?)<\/title>/)?.[1] || '').replace(/<[^>]*>/g, '').trim();
    const link = (block.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/) || block.match(/<link>(.*?)<\/link>/))?.[1] || '';
    const summary = (block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1]
      || block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || '')
      .replace(/<[^>]*>/g, '').trim().slice(0, 300);
    if (title) items.push({ title, link: link.trim(), description: summary });
  }
  return items;
}

async function fetchRSSNews() {
  console.log('\n── RSS Feeds ──');
  const allItems = [];
  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetchWithTimeout(feed.url);
      const xml = await res.text();
      const items = parseRSSItems(xml).slice(0, 10);
      items.forEach(item => { item.source = feed.name; });
      allItems.push(...items);
      console.log(`  ✓ ${feed.name}: ${items.length} items`);
    } catch (err) {
      console.warn(`  ✗ ${feed.name}: ${err.message}`);
    }
  }
  return allItems;
}

// ─────────────────────────────────────────────
// 模块 2: Trendshift（替代 GitHub Trending，评分更一致）
// https://trendshift.io/
// ─────────────────────────────────────────────

const AI_KEYWORDS = /\b(ai|llm|gpt|claude|gemini|agent|rag|embedding|transformer|diffusion|neural|inference|fine.?tun|langchain|llama|openai|anthropic|hugging.?face|vector.?db|machine.?learn|deep.?learn|nlp|computer.?vision|generative|prompt|copilot|model|chatbot|openclaw|sandbox|skill)\b/i;

function parseTrendshiftData(html) {
  const pushes = html.match(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g) || [];
  let combined = '';
  pushes.forEach(p => {
    const inner = p.match(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/)?.[1] || '';
    combined += inner;
  });
  combined = combined.replace(/\\"/g, '"').replace(/\\n/g, '\n');

  const repoRegex = /\{"id":\d+,"date":"[^"]+","rank":(\d+),"score":(\d+),"full_name":"([^"]+)","language":"[^"]*","repository_id":\d+,"repository_stars":(\d+),"repository_forks":(\d+),"repository_language":"([^"]*)","repository_description":"([^"]*)"/g;
  const repos = [];
  let match;
  while ((match = repoRegex.exec(combined)) !== null) {
    repos.push({
      rank: parseInt(match[1]),
      score: parseInt(match[2]),
      fullName: match[3],
      totalStars: parseInt(match[4]),
      forks: parseInt(match[5]),
      language: match[6],
      description: match[7],
    });
  }
  return repos;
}

function filterAIRepos(repos) {
  return repos.filter(r => {
    const text = `${r.fullName} ${r.description}`.toLowerCase();
    return AI_KEYWORDS.test(text);
  });
}

async function fetchTrending() {
  console.log('\n── Trendshift ──');
  try {
    const res = await fetchWithTimeout('https://trendshift.io/', {
      headers: { Accept: 'text/html' },
    }, 15000);
    const html = await res.text();
    const allRepos = parseTrendshiftData(html);
    const aiRepos = filterAIRepos(allRepos);
    const top = aiRepos.slice(0, 8);
    console.log(`  ✓ Total: ${allRepos.length}, AI-related: ${aiRepos.length}, using top ${top.length}`);
    return top;
  } catch (err) {
    console.warn(`  ✗ Trendshift: ${err.message}`);
    return [];
  }
}

// ─────────────────────────────────────────────
// 模块 3: Hugging Face Daily Papers
// ─────────────────────────────────────────────

async function fetchDailyPapers() {
  console.log('\n── HF Daily Papers ──');
  try {
    const res = await fetchWithTimeout('https://huggingface.co/api/daily_papers', {}, 15000);
    const data = await res.json();
    const papers = data
      .map(item => ({
        title: item.title || item.paper?.title || '',
        arxivId: item.paper?.id || '',
        upvotes: item.paper?.upvotes || 0,
        abstract: (item.paper?.summary || item.summary || '').replace(/\n/g, ' ').trim().slice(0, 400),
      }))
      .filter(p => p.title && p.arxivId)
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 8);

    console.log(`  ✓ ${papers.length} papers (sorted by upvotes)`);
    return papers;
  } catch (err) {
    console.warn(`  ✗ HF Daily Papers: ${err.message}`);
    return [];
  }
}

// ─────────────────────────────────────────────
// 模块 4: Release Watchlist
// ─────────────────────────────────────────────

function loadWatchlist(filename) {
  const configPath = join(__dirname, filename);
  if (!existsSync(configPath)) {
    console.warn(`  ⚠ ${filename} not found`);
    return [];
  }
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

async function fetchReleasesFromList(repos, label) {
  const ghToken = process.env.GITHUB_TOKEN;
  const headers = { Accept: 'application/vnd.github+json' };
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`;

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const releases = [];

  for (const { repo, alias } of repos) {
    try {
      const res = await fetchWithTimeout(
        `https://api.github.com/repos/${repo}/releases?per_page=3`,
        { headers },
        10000
      );
      const data = await res.json();
      const recent = data.filter(r => !r.draft && new Date(r.published_at) > cutoff);

      if (recent.length > 0) {
        const latest = recent[0];
        const body = (latest.body || '').slice(0, 500);
        releases.push({
          alias,
          repo,
          tag: latest.tag_name,
          name: latest.name || latest.tag_name,
          url: latest.html_url,
          publishedAt: latest.published_at,
          body,
        });
        console.log(`  ✓ ${alias}: ${latest.tag_name} (${latest.published_at})`);
      } else {
        console.log(`  · ${alias}: no recent release`);
      }
    } catch (err) {
      console.warn(`  ✗ ${alias}: ${err.message}`);
    }
  }

  return releases;
}

async function fetchRecentReleases() {
  console.log('\n── Release Watchlist ──');
  const repos = loadWatchlist('watched-repos.json');
  return fetchReleasesFromList(repos, 'AI Frameworks');
}

async function fetchDevtoolsReleases() {
  console.log('\n── Devtools Watchlist ──');
  const repos = loadWatchlist('watched-devtools.json');
  return fetchReleasesFromList(repos, 'Devtools');
}

// ─────────────────────────────────────────────
// LLM 调用
// ─────────────────────────────────────────────

async function callLLM(systemPrompt, userContent) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('⚠ OPENAI_API_KEY 未设置，跳过 LLM 总结');
    return null;
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`⚠ LLM API ${res.status}: ${body}`);
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn(`⚠ LLM 调用异常：${err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// 每日速递
// ─────────────────────────────────────────────

function buildRawDataForLLM(rssItems, trending, releases, papers, devtoolsReleases) {
  const sections = [];

  if (trending.length > 0) {
    const trendingText = trending.map((r, i) =>
      `${i + 1}. ${r.fullName} — ⭐ ${r.totalStars.toLocaleString()} (score: ${r.score}) [${r.language}]\n   ${r.description}\n   https://github.com/${r.fullName}`
    ).join('\n\n');
    sections.push(`=== TRENDING REPOS (AI-related, via trendshift.io) ===\n\n${trendingText}`);
  }

  if (papers.length > 0) {
    const papersText = papers.map((p, i) =>
      `${i + 1}. ${p.title} (👍 ${p.upvotes})\n   https://arxiv.org/abs/${p.arxivId}\n   ${p.abstract}`
    ).join('\n\n');
    sections.push(`=== DAILY PAPERS (via Hugging Face, sorted by upvotes) ===\n\n${papersText}`);
  }

  if (releases.length > 0) {
    const releasesText = releases.map(r =>
      `- ${r.alias} ${r.tag} (${r.publishedAt})\n  ${r.url}\n  ${r.body}`
    ).join('\n\n');
    sections.push(`=== RELEASE UPDATES (AI Frameworks) ===\n\n${releasesText}`);
  }

  if (devtoolsReleases.length > 0) {
    const devtoolsText = devtoolsReleases.map(r =>
      `- ${r.alias} ${r.tag} (${r.publishedAt})\n  ${r.url}\n  ${r.body}`
    ).join('\n\n');
    sections.push(`=== DEVTOOLS RELEASES (AI Developer Tools) ===\n\n${devtoolsText}`);
  }

  if (rssItems.length > 0) {
    const rssText = rssItems.map((item, i) =>
      `${i + 1}. [${item.source}] ${item.title}\n   ${item.link}\n   ${item.description}`
    ).join('\n\n');
    sections.push(`=== RSS NEWS ===\n\n${rssText}`);
  }

  return sections.join('\n\n\n');
}

const DAILY_SYSTEM_PROMPT = `你是一位资深 AI Agent 工程师兼技术编辑。你的读者是 AI 基础设施和 Agent 方向的工程师。

用户会提供五类原始数据：Trending Repos、Daily Papers、Release Updates、Devtools Releases、RSS News。

请你按以下规则输出 Markdown（不要 frontmatter），严格按栏目顺序：

1. **## 开源热门**
   - 在标题下方添加一行：> 数据来源：[Trendshift](https://trendshift.io/) · [GitHub Trending](https://github.com/trending)
   - 从 Trending 数据中挑选 3~5 个最值得关注的 AI 项目
   - 每个项目严格按以下格式输出（注意换行）：
     ### [owner/repo](GitHub链接)
     **⭐ star数 · 语言**
     （空行）
     一句话中文描述，后面紧跟工程视角点评（两者写在同一段落内，用句号分隔）。
   - 工程视角点评要简短，说明这个项目解决什么问题、适合什么场景
   - 注意：不要使用引用块（>）来包裹star数据

2. **## 论文精选**（如果有 Papers 数据才输出，没有则省略）
   - 从 Daily Papers 中挑选 3~5 篇与 AI Agent、RAG、推理、工具使用等工程方向最相关的论文
   - 每篇论文格式：
     ### 论文中文标题
     **👍 upvotes数** · [arXiv](arXiv链接)
     （空行）
     2~3 句中文摘要，重点说明论文的核心贡献和对工程实践的启发。
   - 优先选择对 Agent 架构、推理能力、工具调用、多模态等方向有实际影响的论文

3. **## 版本更新**（如果有 Release 数据才输出，没有则省略）
   - 列出每个新版本：项目名 + 版本号 + 关键变更摘要（2~3 句话）
   - 附 Release 链接

4. **## 开发者工具**（如果有 Devtools Release 数据才输出，没有则省略）
   - 列出 AI 编码/开发工具的新版本更新
   - 每个工具：名称 + 版本号 + 关键变更摘要
   - 附 Release 链接

5. **## 行业动态**
   - 从 RSS 新闻中筛选 5~8 条最重要的，优先选择：
     a. 对 AI 工程实践有直接影响的（框架更新、API 变更、平台策略）
     b. 重大产品发布或融资
     c. 有深度技术分析的博文
   - 每条：中文标题 + 2~3 句中文摘要 + 原文链接
   - 跳过纯科普、观点争论等非技术内容

重要：所有输出必须使用中文（项目名、专有名词、论文标题翻译后可保留英文原名）。标题、描述、摘要、点评全部用中文撰写。
整体风格：简洁专业，面向工程师，关注"这对我的技术选型/架构/开发有什么影响"。`;

function buildFallbackDaily(rssItems, trending, releases, papers, devtoolsReleases) {
  const parts = [];

  if (trending.length > 0) {
    parts.push('## 开源热门\n\n> 数据来源：[Trendshift](https://trendshift.io/) · [GitHub Trending](https://github.com/trending)\n');
    trending.slice(0, 5).forEach(r => {
      parts.push(`### [${r.fullName}](https://github.com/${r.fullName})\n**⭐ ${r.totalStars.toLocaleString()} · ${r.language}**\n\n${r.description}\n`);
    });
  }

  if (papers.length > 0) {
    parts.push('## 论文精选\n');
    papers.slice(0, 5).forEach(p => {
      parts.push(`### ${p.title}\n**👍 ${p.upvotes}** · [arXiv](https://arxiv.org/abs/${p.arxivId})\n\n${p.abstract.slice(0, 200)}...\n`);
    });
  }

  if (releases.length > 0) {
    parts.push('## 版本更新\n');
    releases.forEach(r => {
      parts.push(`### ${r.alias} ${r.tag}\n\n${r.body.slice(0, 200)}...\n\n**链接**：${r.url}\n`);
    });
  }

  if (devtoolsReleases.length > 0) {
    parts.push('## 开发者工具\n');
    devtoolsReleases.forEach(r => {
      parts.push(`### ${r.alias} ${r.tag}\n\n${r.body.slice(0, 200)}...\n\n**链接**：${r.url}\n`);
    });
  }

  if (rssItems.length > 0) {
    parts.push('## 行业动态\n');
    rssItems.slice(0, 8).forEach(item => {
      parts.push(`### ${item.title}\n\n${item.description}\n\n**来源**：[${item.source}](${item.link})\n`);
    });
  }

  return parts.join('\n');
}

async function generateDaily(force = false) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const filename = `${dateStr}-daily.md`;
  const filepath = join(DOCS_DIR, filename);
  const generatedAt = getGeneratedAt();

  if (existsSync(filepath) && !force) {
    console.log(`⏭ ${filename} 已存在，跳过`);
    return;
  }

  console.log(`\n📰 生成每日速递 (${dateStr})...`);

  const [rssItems, trending, releases, papers, devtoolsReleases] = await Promise.all([
    fetchRSSNews(),
    fetchTrending(),
    fetchRecentReleases(),
    fetchDailyPapers(),
    fetchDevtoolsReleases(),
  ]);

  if (rssItems.length === 0 && trending.length === 0 && releases.length === 0 && papers.length === 0) {
    console.log('所有数据源均为空，跳过生成');
    return;
  }

  const rawData = buildRawDataForLLM(rssItems, trending, releases, papers, devtoolsReleases);
  const llmResult = await callLLM(DAILY_SYSTEM_PROMPT, rawData);
  const content = llmResult || buildFallbackDaily(rssItems, trending, releases, papers, devtoolsReleases);

  const md = `---
title: "AI 速递 ${dateStr}"
description: "${dateStr} AI 技术日报"
---

> 生成时间：${generatedAt.cn}（UTC: ${generatedAt.iso}）

${content}
`;

  writeFileSync(filepath, md);
  console.log(`\n✅ 已生成 ${filepath}`);
}

// ─────────────────────────────────────────────
// 每周总结
// ─────────────────────────────────────────────

const WEEKLY_SYSTEM_PROMPT = `你是一位资深 AI Agent 工程师兼技术分析师。你的读者是 AI 方向的工程师。

用户会提供本周的每日速递内容合集。

请你输出一份深度技术周报（Markdown，不要 frontmatter）：

1. **## 本周要点**
   - 提炼 5~8 个本周最重要的技术主题/事件
   - 每个主题：标题 + 3~5 句分析（背景、工程影响、趋势判断）
   - 优先关注：框架演进、模型能力变化、工具链更新、架构范式变化

2. **## 本周热门项目**
   - 如果每日速递中出现了 GitHub Trending 项目，汇总本周出现频次最高 / star 增长最快的 Top 5
   - 每个项目一句话点评

3. **## 本周论文亮点**（如果本周每日速递中包含论文精选，汇总最重要的 3~5 篇）
   - 论文标题 + 核心贡献 + 工程影响
   - 如果本周没有论文内容则省略

4. **## 本周版本更新**（如果本周有 Release / 开发者工具更新才输出，否则省略）
   - 汇总表格：项目名 | 版本 | 关键变更

5. **## 工程师视角**
   - 3~5 句深度观察：本周变化对 AI 工程师的技术选型、架构决策意味着什么
   - 有态度、有判断，不要泛泛而谈

重要：所有输出必须使用中文。
整体风格：深度、专业、有观点。`;

async function generateWeekly(force = false) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() - 6);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startStr = weekStart.toISOString().split('T')[0];
  const endStr = weekEnd.toISOString().split('T')[0];
  const filename = `${startStr}-weekly.md`;
  const filepath = join(DOCS_DIR, filename);
  const generatedAt = getGeneratedAt();

  if (existsSync(filepath) && !force) {
    console.log(`⏭ ${filename} 已存在，跳过`);
    return;
  }

  console.log(`\n📋 生成周报 (${startStr} ~ ${endStr})...`);

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

  const llmResult = await callLLM(WEEKLY_SYSTEM_PROMPT, dailyContents);
  const content = llmResult || `> 本周自动总结未启用或调用失败，以下为原始内容合并。\n\n${dailyContents}`;

  const md = `---
title: "周报 ${startStr} ~ ${endStr}"
description: "${startStr} 至 ${endStr} AI 技术周报"
---

> 生成时间：${generatedAt.cn}（UTC: ${generatedAt.iso}）

${content}
`;

  writeFileSync(filepath, md);
  console.log(`\n✅ 已生成 ${filepath}`);
}

// ─────────────────────────────────────────────
// 入口
// ─────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.find(arg => arg === '--daily' || arg === '--weekly');
const force = args.includes('--force');

if (mode === '--daily') {
  generateDaily(force).catch(err => { console.error(err); process.exit(1); });
} else if (mode === '--weekly') {
  generateWeekly(force).catch(err => { console.error(err); process.exit(1); });
} else {
  console.log(`AI News v2 — 技术日报生成器

用法：
  node scripts/fetch-ai-news.mjs --daily    生成每日速递
  node scripts/fetch-ai-news.mjs --weekly   生成每周总结
  加 --force 强制覆盖已存在文件

数据源：
  • RSS: ${RSS_FEEDS.map(f => f.name).join(', ')}
  • GitHub Trending (AI 关键词过滤, via Trendshift)
  • HF Daily Papers (Hugging Face 社区投票论文)
  • Release Watchlist (scripts/watched-repos.json)
  • Devtools Watchlist (scripts/watched-devtools.json)

环境变量：
  OPENAI_API_KEY   — LLM 总结（必须）
  OPENAI_BASE_URL  — 自定义 API 地址（可选）
  OPENAI_MODEL     — 模型名称（默认 gpt-4o-mini）
  GITHUB_TOKEN     — GitHub API 认证（可选，提升速率限制）`);
}
