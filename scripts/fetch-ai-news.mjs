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
 *   DEEPSEEK_API_KEY  — 生成周报时必须
 *   DEEPSEEK_BASE_URL — 可选（默认 https://api.deepseek.com）
 *   DEEPSEEK_MODEL    — 可选（默认 deepseek-v4-flash）
 *   GITHUB_TOKEN    — 可选（提升 API 速率限制）
 */

import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = 'src/content/docs/ai-news';
const DAILY_CACHE_DIR = 'src/data/ai-news-daily';

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

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000, retries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { 'User-Agent': 'YLQ-Box-AI-News/2.0', ...options.headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────────
// 模块 1: RSS Feeds
// ─────────────────────────────────────────────

const RSS_FEEDS = [
  { name: 'OpenAI 官方', type: '一手', priority: 1, url: 'https://openai.com/news/rss.xml' },
  { name: 'Google DeepMind 官方', type: '一手', priority: 1, url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Google AI 官方', type: '一手', priority: 1, url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Hugging Face Blog', type: '一手', priority: 1, url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Databricks Blog', type: '一手', priority: 1, url: 'https://www.databricks.com/feed' },
  { name: 'Cloudflare Blog', type: '一手', priority: 1, url: 'https://blog.cloudflare.com/rss/', filterAI: true },
  { name: 'Cursor Changelog', type: '一手', priority: 1, url: 'https://cursor.com/changelog/rss.xml' },
  { name: 'Simon Willison', type: '开发者', priority: 2, url: 'https://simonwillison.net/atom/everything/', filterAI: true },
  { name: 'Hacker News AI', type: '社区', priority: 3, url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT+OR+Claude+OR+agent&points=50&count=20' },
  { name: 'The Decoder', type: '资讯', priority: 3, url: 'https://the-decoder.com/feed/' },
  { name: 'TechCrunch AI', type: '资讯', priority: 3, url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'IT之家', type: '资讯', priority: 3, url: 'https://www.ithome.com/rss/', filterAI: true },
  { name: 'InfoQ AI/ML', type: '资讯', priority: 3, url: 'https://feed.infoq.com/ai-ml-data-eng/' },
];

const AI_NEWS_KEYWORDS = /\b(ai|llm|gpt|claude|gemini|agent|rag|embedding|transformer|diffusion|neural|inference|fine.?tun|langchain|llama|openai|anthropic|hugging.?face|vector.?db|machine.?learn|deep.?learn|nlp|computer.?vision|generative|prompt|copilot|model|chatbot|openclaw|sandbox|skill|mcp)\b|人工智能|大模型|智能体|生成式|机器学习|深度学习|模型发布|模型训练|推理服务|多模态|提示词|上下文协议|编码助手/i;

function extractPublishedAt(block) {
  return (block.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i)?.[1]
    || block.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i)?.[1]
    || block.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]
    || block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1]
    || '').trim();
}

function cleanFeedText(value, maxLength) {
  const cleaned = value
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;|&ndash;/gi, '，')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim();
  return typeof maxLength === 'number' ? cleaned.slice(0, maxLength) : cleaned;
}

function isRecentFeedItem(item, maxAgeHours = 72) {
  if (!item.publishedAt) return true;
  const publishedAt = new Date(item.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) return true;
  return publishedAt >= new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
}

function normalizeNewsUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    [...url.searchParams.keys()].forEach(key => {
      if (/^(utm_|ref$|source$|campaign$)/i.test(key)) url.searchParams.delete(key);
    });
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return rawUrl.trim().replace(/\/$/, '');
  }
}

function normalizeNewsTitle(title) {
  return title.toLowerCase().replace(/&[^;]+;/g, ' ').replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ').trim();
}

function dedupeAndRankNews(items) {
  const seenUrls = new Set();
  const seenTitles = new Set();
  return items
    .sort((a, b) => a.priority - b.priority || String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .filter(item => {
      const urlKey = normalizeNewsUrl(item.link);
      const titleKey = normalizeNewsTitle(item.title);
      if ((!urlKey && !titleKey) || (urlKey && seenUrls.has(urlKey)) || (titleKey && seenTitles.has(titleKey))) return false;
      if (urlKey) seenUrls.add(urlKey);
      if (titleKey) seenTitles.add(titleKey);
      return true;
    });
}

function parseRSSItems(xml) {
  const items = [];
  // RSS <item> format
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = cleanFeedText(block.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1]
      || block.match(/<title>(.*?)<\/title>/)?.[1] || '');
    const link = cleanFeedText(block.match(/<link>(.*?)<\/link>/)?.[1] || '');
    const desc = cleanFeedText(block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1]
      || block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '', 300);
    if (title) items.push({ title, link, description: desc, publishedAt: extractPublishedAt(block) });
  }
  // Atom <entry> format (for Simon Willison, HuggingFace)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = cleanFeedText(block.match(/<title[^>]*>(.*?)<\/title>/)?.[1] || '');
    const link = (block.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/) || block.match(/<link>(.*?)<\/link>/))?.[1] || '';
    const summary = cleanFeedText(block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1]
      || block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || '', 300);
    if (title) items.push({ title, link: cleanFeedText(link), description: summary, publishedAt: extractPublishedAt(block) });
  }
  return items;
}

async function fetchRSSNews() {
  console.log('\n── RSS Feeds ──');
  const results = await Promise.all(RSS_FEEDS.map(async feed => {
    try {
      const res = await fetchWithTimeout(feed.url);
      const xml = await res.text();
      const items = parseRSSItems(xml)
        .filter(item => isRecentFeedItem(item))
        .filter(item => !feed.filterAI || AI_NEWS_KEYWORDS.test(`${item.title} ${item.description}`))
        .slice(0, 8)
        .map(item => ({ ...item, source: feed.name, sourceType: feed.type, priority: feed.priority }));
      console.log(`  ✓ ${feed.name}: ${items.length} items`);
      return items;
    } catch (err) {
      console.warn(`  ✗ ${feed.name}: ${err.message}`);
      return [];
    }
  }));
  return dedupeAndRankNews(results.flat());
}

async function checkNewsSources() {
  const items = await fetchRSSNews();
  if (items.length === 0) throw new Error('所有 RSS 消息源均未返回近 72 小时内容');

  const typeCounts = items.reduce((counts, item) => {
    counts[item.sourceType] = (counts[item.sourceType] || 0) + 1;
    return counts;
  }, {});
  const summary = Object.entries(typeCounts).map(([type, count]) => `${type} ${count}`).join('，');
  console.log(`\n✅ RSS 消息源检查通过，共 ${items.length} 条去重内容（${summary}）`);
}

// ─────────────────────────────────────────────
// 模块 2: Trendshift（替代 GitHub Trending，评分更一致）
// https://trendshift.io/
// ─────────────────────────────────────────────

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
    return AI_NEWS_KEYWORDS.test(text);
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
// 模块 3: Release Watchlist
// ─────────────────────────────────────────────

function loadWatchlist(filename) {
  const configPath = join(__dirname, filename);
  if (!existsSync(configPath)) {
    console.warn(`  ⚠ ${filename} not found`);
    return [];
  }
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

async function fetchReleasesFromList(repos) {
  const ghToken = process.env.GITHUB_TOKEN;
  const headers = { Accept: 'application/vnd.github+json' };
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`;

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const releases = await Promise.all(repos.map(async ({ repo, alias }) => {
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
        const release = {
          alias,
          repo,
          tag: latest.tag_name,
          name: latest.name || latest.tag_name,
          url: latest.html_url,
          publishedAt: latest.published_at,
          body,
        };
        console.log(`  ✓ ${alias}: ${latest.tag_name} (${latest.published_at})`);
        return release;
      } else {
        console.log(`  · ${alias}: no recent release`);
      }
    } catch (err) {
      console.warn(`  ✗ ${alias}: ${err.message}`);
    }
    return null;
  }));

  return releases.filter(Boolean);
}

async function fetchRecentReleases() {
  console.log('\n── Release Watchlist ──');
  const repos = loadWatchlist('watched-repos.json');
  return fetchReleasesFromList(repos);
}

async function fetchDevtoolsReleases() {
  console.log('\n── Devtools Watchlist ──');
  const repos = loadWatchlist('watched-devtools.json');
  return fetchReleasesFromList(repos);
}

// ─────────────────────────────────────────────
// LLM 调用
// ─────────────────────────────────────────────

async function callLLM(systemPrompt, userContent, options = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn('⚠ DEEPSEEK_API_KEY 未设置，跳过 LLM 总结');
    return null;
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
  const {
    thinking = 'disabled',
    maxTokens = 6000,
    timeoutMs = 120000,
  } = options;

  const requestBody = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    max_tokens: maxTokens,
    thinking: { type: thinking },
  };

  if (thinking === 'disabled') requestBody.temperature = 0.2;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const requestId = res.headers.get('x-request-id');
      const requestHint = requestId ? `，request-id ${requestId}` : '';
      console.warn(`⚠ DeepSeek API ${res.status} ${res.statusText}${requestHint}`);
      return null;
    }

    const data = await res.json();
    const choice = data?.choices?.[0];
    const content = choice?.message?.content?.trim();
    if (!content) {
      const finishReason = choice?.finish_reason || 'unknown';
      const completionTokens = data?.usage?.completion_tokens ?? 'unknown';
      console.warn(`⚠ DeepSeek 返回空正文，finish_reason ${finishReason}，completion_tokens ${completionTokens}`);
      return null;
    }
    return content;
  } catch (err) {
    console.warn(`⚠ LLM 调用异常：${err.message}`);
    return null;
  }
}

const CHINESE_REVIEW_PROMPT = `你是中文技术编辑。请检查用户给出的 Markdown，并把所有面向读者的英文内容改成自然、准确的简体中文。

必须翻译新闻标题、项目描述、Release 摘要、新闻摘要和分析。项目名、仓库名、模型名、API 名、版本号、代码、URL 与行业通用缩写可以保留英文。不要直译项目名；原文被截断时删除不完整句子，不要续写。保留原有 Markdown 结构和全部链接，不添加原文没有的事实，不输出 frontmatter，也不要解释修改过程。`;

function stripMarkdownForLanguageCheck(line) {
  return line
    .replace(/https?:\/\/\S+/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^[#>*+\-\d.\s|]+/, '')
    .replace(/[|*_~]/g, ' ')
    .trim();
}

function isAllowedEnglishIdentifier(text) {
  if (/^[\w@.-]+\/[\w@.-]+$/.test(text)) return true;
  if (/^(?:OpenAI Codex CLI|OpenClaw|LangChain|LlamaIndex|CrewAI|Ollama|Goose|vLLM|Continue|MCP Servers?)\b[\w.=@+\-\s]*$/i.test(text)) return true;
  return false;
}

function findUntranslatedEnglishBlocks(markdown) {
  const issues = [];
  let inCodeFence = false;
  let inFrontmatter = false;
  let frontmatterClosed = false;

  markdown.split('\n').forEach((line, index) => {
    if (index === 0 && line.trim() === '---') {
      inFrontmatter = true;
      return;
    }
    if (inFrontmatter) {
      if (line.trim() === '---') {
        inFrontmatter = false;
        frontmatterClosed = true;
      }
      return;
    }
    if (!frontmatterClosed && line.trim() === '---') frontmatterClosed = true;
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      return;
    }
    if (inCodeFence || /^\s*\|/.test(line)) return;

    const text = stripMarkdownForLanguageCheck(line);
    if (!text || isAllowedEnglishIdentifier(text)) return;

    const latinCount = (text.match(/[A-Za-z]/g) || []).length;
    const cjkCount = (text.match(/[\u3400-\u9fff]/g) || []).length;
    const wordCount = (text.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
    const isHeading = /^#{2,4}\s/.test(line) || /^\s*(?:\d+\.\s*)?\*\*.+\*\*\s*$/.test(line);
    const englishHeading = isHeading && cjkCount === 0 && latinCount >= 24 && wordCount >= 4;
    const englishProse = !isHeading && latinCount >= 72 && (cjkCount === 0 || latinCount > cjkCount * 4);

    if (englishHeading || englishProse) {
      issues.push({ line: index + 1, text: text.slice(0, 120) });
    }
  });

  return issues;
}

async function ensureChineseWeeklyContent(content) {
  let issues = findUntranslatedEnglishBlocks(content);
  if (issues.length === 0) return content;

  console.warn(`⚠ 周报仍有 ${issues.length} 处英文内容，进行二次中文校对`);
  const revised = await callLLM(CHINESE_REVIEW_PROMPT, content, {
    thinking: 'disabled',
    maxTokens: 8000,
  });
  if (!revised) return null;

  issues = findUntranslatedEnglishBlocks(revised);
  if (issues.length > 0) {
    console.warn(`⚠ 中文校对后仍有 ${issues.length} 处英文内容，停止发布`);
    issues.slice(0, 5).forEach(issue => console.warn(`  L${issue.line} ${issue.text}`));
    return null;
  }

  return revised;
}

function checkPublishedReportLanguages() {
  const files = readdirSync(DOCS_DIR)
    .filter(name => /-(weekly|monthly)\.md$/.test(name))
    .sort();
  const failed = [];

  files.forEach(name => {
    const markdown = readFileSync(join(DOCS_DIR, name), 'utf-8');
    const issues = findUntranslatedEnglishBlocks(markdown);
    if (issues.length > 0) failed.push({ name, issues });
  });

  if (failed.length === 0) {
    console.log(`✅ ${files.length} 篇周报和月报均通过中文检查`);
    return true;
  }

  failed.forEach(({ name, issues }) => {
    console.error(`✗ ${name} 存在 ${issues.length} 处未翻译内容`);
    issues.slice(0, 8).forEach(issue => console.error(`  L${issue.line} ${issue.text}`));
  });
  return false;
}

const LEGACY_REPORT_TITLE_TRANSLATIONS = new Map([
  ['BeyondSWE: Do Current Code Agents Survive Beyond Single-Repo Fixing?', 'BeyondSWE：当前代码智能体能否处理单仓库修复之外的任务？'],
  ['Heterogeneous Agent Collaborative Reinforcement Learning (HACRL)', '异构智能体协同强化学习（HACRL）'],
  ['SkillNet: Create, Evaluate, and Connect AI Skills', 'SkillNet：创建、评估与连接 AI 技能'],
  ['Thinking as Recall: How Reasoning Unlocks Parametric Knowledge in LLMs', '把思考当作回忆：推理如何解锁大模型的参数化知识'],
  ['OpenClaw-RL: Train Any Agent Just by Chatting', 'OpenClaw-RL：通过对话训练任意智能体'],
]);

function fixPublishedReportLanguages() {
  const files = readdirSync(DOCS_DIR)
    .filter(name => /-(weekly|monthly)\.md$/.test(name))
    .sort();
  let updated = 0;

  files.forEach(name => {
    const filepath = join(DOCS_DIR, name);
    const original = readFileSync(filepath, 'utf-8');
    let markdown = original;
    LEGACY_REPORT_TITLE_TRANSLATIONS.forEach((translated, english) => {
      markdown = markdown.replaceAll(english, translated);
    });
    if (markdown === original) return;
    writeFileSync(filepath, markdown);
    updated += 1;
    console.log(`  ✓ ${name}`);
  });

  console.log(`\n✅ 已更新 ${updated} 篇历史报告`);
  return checkPublishedReportLanguages();
}

// ─────────────────────────────────────────────
// 每日速递
// ─────────────────────────────────────────────

function selectDailyNews(items) {
  const quotas = { '一手': 10, '开发者': 4, '社区': 4, '资讯': 6 };
  const selected = [];
  const sourceCounts = new Map();

  Object.entries(quotas).forEach(([type, limit]) => {
    const candidates = items.filter(item => item.sourceType === type);
    for (const item of candidates) {
      const sourceCount = sourceCounts.get(item.source) || 0;
      if (sourceCount >= 3) continue;
      selected.push(item);
      sourceCounts.set(item.source, sourceCount + 1);
      if (selected.filter(selectedItem => selectedItem.sourceType === type).length >= limit) break;
    }
  });

  return selected;
}

function buildDailySnapshot(rssItems, trending, releases, devtoolsReleases) {
  const parts = [];

  if (trending.length > 0) {
    parts.push('## 开源热门\n\n> 数据来源：[Trendshift](https://trendshift.io/) · [GitHub Trending](https://github.com/trending)\n');
    trending.slice(0, 5).forEach(r => {
      const desc = r.description && r.description.trim() ? r.description : '（无描述）';
      parts.push(`### [${r.fullName}](https://github.com/${r.fullName})\n**⭐ ${r.totalStars.toLocaleString()} · ${r.language}**\n\n${desc}\n`);
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
    selectDailyNews(rssItems).forEach(item => {
      const publishedAt = item.publishedAt ? ` · ${item.publishedAt}` : '';
      parts.push(`### [${item.title}](${item.link})\n\n${item.description || '原始来源未提供摘要。'}\n\n**来源**：${item.sourceType} · ${item.source}${publishedAt}\n`);
    });
  }

  return parts.join('\n');
}

async function generateDaily(force = false) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const filename = `${dateStr}-daily.md`;
  const filepath = join(DAILY_CACHE_DIR, filename);
  const generatedAt = getGeneratedAt();

  mkdirSync(DAILY_CACHE_DIR, { recursive: true });

  if (existsSync(filepath) && !force) {
    console.log(`⏭ ${filename} 已存在，跳过`);
    return;
  }

  console.log(`\n📰 生成每日速递 (${dateStr})...`);

  const [rssItems, trending, releases, devtoolsReleases] = await Promise.all([
    fetchRSSNews(),
    fetchTrending(),
    fetchRecentReleases(),
    fetchDevtoolsReleases(),
  ]);

  if (rssItems.length === 0 && trending.length === 0 && releases.length === 0 && devtoolsReleases.length === 0) {
    console.log('所有数据源均为空，跳过生成');
    return;
  }

  const content = buildDailySnapshot(rssItems, trending, releases, devtoolsReleases);

  const md = `> 内部采集快照，不作为站点文章发布。
>
> 生成时间：${generatedAt.cn}（UTC: ${generatedAt.iso}）

${content}
`;

  writeFileSync(filepath, md);
  console.log(`\n✅ 已生成内部快照 ${filepath}`);
}

// ─────────────────────────────────────────────
// 每周总结
// ─────────────────────────────────────────────

const WEEKLY_SYSTEM_PROMPT = `你是长期做 AI Agent 工程的一线开发者，也负责中文技术内容编辑。读者想在十分钟内知道本周哪些变化值得花时间验证。

用户会提供七天内的采集快照。每份快照的二级标题是日期，内容可能重复，也可能包含旧格式留下的“论文精选”。读者不看论文，必须完全忽略“论文精选”及 arXiv 内容。

请根据以下固定结构输出 Markdown，不要 frontmatter，不要写生成过程。

## 本周判断

用两到三段话串起本周的一条主线。判断必须由后文至少三个具体事件支撑。不要逐条预告，不要写“本周 AI 领域动态频繁”一类开场。事实与判断要分清，无法从材料确认的内容不要补。

## 值得花时间看

从产品发布、工程实践、安全事件、开发工具、开源项目和行业变化中混合选择五到七条，按工程价值排序，不按数据来源分栏。精选至少覆盖三个类别，避免整期被同一种内容占满。每条严格使用下面的格式。

### 1. [中文标题](原始链接)

\`类别\` · \`来源\` · \`8 月 8 日\`

用两到三句说明发生了什么。保留能帮助判断的数字、版本号、实验条件和限制，不重复标题。

**为什么值得看**

用一到两句说明它会影响哪个具体场景、技术选择或验证工作。不要写“值得关注”“意义重大”这种空话。

类别只能从模型、Agent、开发工具、开源项目、产品、安全、行业中选择。“版本更新”和“开发者工具”统一写 GitHub Releases，其他内容使用材料里的原始来源名称。日期取该条内容最后一次出现的快照日期。同一事件在多天或多家来源出现时只写一次，来源可并列，但不要虚构第二信源。官方发布与媒体转述重复时优先使用官方链接。

## 项目与版本

用 Markdown 表格列出三到六个确有工程影响的项目或版本。列名固定为“项目”“版本或状态”“影响”“链接”。每行只写一个版本，链接必须指向这个版本的原始 Release，不能把另一个版本的变更和链接拼在一起。影响只写一个具体变化。没有有效说明的版本不要凑数，已经在精选中详细介绍的内容不要重复分析。

## 下周观察

写两到三个编号条目。每条指出一个需要继续跟踪的问题，以及下周可以验证它的公开信号，例如版本发布、评测数据、API 变更或事故复盘。不要预测股价、融资或无法验证的结果。

重要约束：
- 只使用用户提供的材料，不增加材料外的事实、因果或数字。
- 标题、说明和判断使用自然中文。项目名、模型名、API 名、版本号和通用缩写可保留英文。
- 原始摘要被截断时，只使用截断前能够确认的事实，不续写原句，也不要向读者描述“摘要截断”“材料未披露”等采集状态。信息不足以写出一条完整摘要时，跳过该条。
- 合并标题近似、链接相同或描述同一事件的内容。不要把每日热度变化当成多条新闻。
- 一条精选合并多个版本时，每个版本号都要附自己的链接。不要让标题链接指向其中一个版本，正文却介绍另一个版本。
- 完全忽略论文、arXiv 链接和论文热度。研究内容只有在已经形成可用产品、API、开源工具或工程事故时才可写对应的落地事件。
- 原材料带有 reportedly、据报道、消息称、被曝等不确定表述时，正文必须保留来源归属和不确定性，不能改写成已经确认的事实。
- 只有标题而没有事实细节的材料不要进入精选。材料没有比较数据时，不要自行判断某种方案更轻、更快、更安全或更可靠，也不要从产品名称推导架构、成本和适用范围。
- 不要使用“本周要点”“本周热门项目”“本周论文亮点”“本周版本更新”“工程师视角”等旧栏目。
- 不要写套话，不要把摘要改写成宣传文案。除非材料明确支持，不要使用“首次”“已经成熟”“标志着”“必然改变”或同等强度的判断。
- 正文不要使用冒号、破折号和“不是……而是……”“不再……而是……”“并非……而是……”式翻案句，Markdown 表格分隔符与 URL 不受此限制。`;

const WEEKLY_REVIEW_PROMPT = `你是中文技术周报的终审编辑。用户会给出一份 Markdown 周报和结构问题。请修订全文并只输出修订后的 Markdown，不要解释。

必须保留且只保留四个二级标题，顺序固定为“本周判断”“值得花时间看”“项目与版本”“下周观察”。“值得花时间看”必须有五到七个编号三级标题，每条都带一行“类别 · 来源 · 日期”元数据和一个“为什么值得看”段落。“项目与版本”必须是四列表格。“下周观察”必须有两到三个可验证条目。删除所有论文、arXiv 链接和论文解读。保留其他有效链接，不增加输入材料之外的事实。原材料带有 reportedly、据报道、消息称、被曝等表述时，保留来源归属和不确定性。正文不要使用翻案句。正文使用自然中文，项目名、模型名、API 名和版本号可保留英文。`;

function findWeeklyStructureIssues(content) {
  const issues = [];
  const requiredHeadings = ['本周判断', '值得花时间看', '项目与版本', '下周观察'];
  const headings = [...content.matchAll(/^## ([^#\n].*)$/gm)].map(match => match[1].trim());

  if (headings.join('|') !== requiredHeadings.join('|')) {
    issues.push(`二级标题必须依次为 ${requiredHeadings.join('、')}`);
  }

  if (/^## (本周要点|本周热门项目|本周论文精选|本周论文亮点|论文精选|本周版本更新|工程师视角)$/m.test(content)) {
    issues.push('仍包含旧栏目');
  }

  if (/arxiv\.org|`论文`|^#{2,4} .*论文/gim.test(content)) issues.push('周报仍包含论文内容');

  if (/[：—]/.test(content)) issues.push('正文仍有冒号或破折号');
  if (/(?:不是|并非|不再|不在于).{0,60}(?:而是|在于)|看似.{0,60}实则/s.test(content)) issues.push('正文仍有翻案句');
  if (/(摘要截断|摘要被截断|材料只有|工程回路)/.test(content)) issues.push('正文仍有内部采集状态或空泛表达');

  const featured = content.match(/## 值得花时间看\s*([\s\S]*?)\n## 项目与版本/)?.[1] || '';
  const featuredCount = (featured.match(/^### \d+\. /gm) || []).length;
  const reasonCount = (featured.match(/^\*\*为什么值得看\*\*$/gm) || []).length;
  const metadataLines = featured.match(/^`[^`\n]+` · `[^`\n]+` · `\d{1,2} 月 \d{1,2} 日`$/gm) || [];
  const categories = metadataLines.map(line => line.match(/^`([^`]+)`/)?.[1]).filter(Boolean);
  const metadataCount = metadataLines.length;

  if (featuredCount < 5 || featuredCount > 7) issues.push('精选条目必须为五到七条');
  if (reasonCount !== featuredCount) issues.push('每条精选都要有“为什么值得看”');
  if (metadataCount !== featuredCount) issues.push('每条精选都要有类别、来源和日期');
  if (categories.includes('论文')) issues.push('精选不能包含论文');
  if (new Set(categories).size < 3) issues.push('精选至少覆盖三个类别');

  const versionSection = content.match(/## 项目与版本\s*([\s\S]*?)\n## 下周观察/)?.[1] || '';
  if (!/^\|\s*项目\s*\|\s*版本或状态\s*\|\s*影响\s*\|\s*链接\s*\|/m.test(versionSection)) {
    issues.push('项目与版本缺少固定四列表格');
  }
  const versionRows = versionSection.split('\n').filter(line => /^\|.+\|$/.test(line)).slice(2);
  if (versionRows.some(line => line.split('|')[2]?.includes(' / '))) {
    issues.push('项目与版本表仍有一行合并多个版本');
  }

  const watchSection = content.match(/## 下周观察\s*([\s\S]*)$/)?.[1] || '';
  const watchCount = (watchSection.match(/^\d+\.\s+/gm) || []).length;
  if (watchCount < 2 || watchCount > 3) issues.push('下周观察必须为两到三个编号条目');

  return issues;
}

async function ensureWeeklyStructure(content) {
  let issues = findWeeklyStructureIssues(content);
  if (issues.length === 0) return content;

  console.warn(`⚠ 周报结构有 ${issues.length} 个问题，进行一次自动返工`);
  const revised = await callLLM(
    `${WEEKLY_REVIEW_PROMPT}\n\n当前结构问题：\n- ${issues.join('\n- ')}`,
    content,
    { thinking: 'disabled', maxTokens: 8000 }
  );
  if (!revised) return null;

  issues = findWeeklyStructureIssues(revised);
  if (issues.length > 0) {
    console.warn(`⚠ 自动返工后仍有结构问题：${issues.join('；')}`);
    return null;
  }

  return revised;
}

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
  if (existsSync(filepath) && !force) {
    console.log(`⏭ ${filename} 已存在，跳过`);
    return;
  }

  console.log(`\n📋 生成周报 (${startStr} ~ ${endStr})...`);

  if (!existsSync(DAILY_CACHE_DIR)) {
    console.log('本周没有每日采集快照，跳过');
    return;
  }

  const files = readdirSync(DAILY_CACHE_DIR)
    .filter(f => {
      const date = f.match(/^(\d{4}-\d{2}-\d{2})-daily\.md$/)?.[1];
      return date && date >= startStr && date <= endStr;
    })
    .sort();

  if (files.length === 0) {
    console.log('本周没有每日速递文件，跳过');
    return;
  }

  const dailyContents = files.map(f => {
    const raw = readFileSync(join(DAILY_CACHE_DIR, f), 'utf-8');
    return `## ${f.replace('-daily.md', '')}\n\n${raw.trim()}`;
  }).join('\n\n---\n\n');

  const llmResult = await callLLM(WEEKLY_SYSTEM_PROMPT, dailyContents, {
    thinking: 'enabled',
    maxTokens: 24000,
    timeoutMs: 300000,
  });
  if (!llmResult) {
    throw new Error('周报总结失败，已停止发布，现有文件不会被英文原始数据覆盖');
  }

  const structuredContent = await ensureWeeklyStructure(llmResult);
  if (!structuredContent) {
    throw new Error('周报未通过结构检查，已停止发布');
  }

  const content = await ensureChineseWeeklyContent(structuredContent);
  if (!content || findWeeklyStructureIssues(content).length > 0) {
    throw new Error('周报未通过中文检查，已停止发布');
  }

  const md = `---
title: "周报 ${startStr} ~ ${endStr}"
description: "${startStr} 至 ${endStr} AI 技术周报"
date: ${endStr}
lastUpdated: ${endStr}
---

> 本周从 ${files.length} 份内部快照中去重整理，信息截止 ${endStr}。项目名、模型名与版本号保留英文。

${content}
`;

  writeFileSync(filepath, md);
  console.log(`\n✅ 已生成 ${filepath}`);
}

// ─────────────────────────────────────────────
// 入口
// ─────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.find(arg => ['--daily', '--weekly', '--fix-language', '--check-language', '--check-sources'].includes(arg));
const force = args.includes('--force');

if (mode === '--daily') {
  generateDaily(force).catch(err => { console.error(err); process.exit(1); });
} else if (mode === '--weekly') {
  generateWeekly(force).catch(err => { console.error(err); process.exit(1); });
} else if (mode === '--fix-language') {
  if (!fixPublishedReportLanguages()) process.exit(1);
} else if (mode === '--check-language') {
  if (!checkPublishedReportLanguages()) process.exit(1);
} else if (mode === '--check-sources') {
  checkNewsSources().catch(err => { console.error(err); process.exit(1); });
} else {
  console.log(`AI News v2 — 技术日报生成器

用法：
  node scripts/fetch-ai-news.mjs --daily    生成内部采集快照（不发布）
  node scripts/fetch-ai-news.mjs --weekly   生成每周总结
  node scripts/fetch-ai-news.mjs --fix-language   修复历史报告中已知的英文标题
  node scripts/fetch-ai-news.mjs --check-language  检查已发布周报和月报是否仍有英文正文
  node scripts/fetch-ai-news.mjs --check-sources   检查 RSS 消息源和近 72 小时内容
  加 --force 强制覆盖已存在文件

数据源：
  • RSS: ${RSS_FEEDS.map(f => f.name).join(', ')}
  • GitHub Trending (AI 关键词过滤, via Trendshift)
  • Release Watchlist (scripts/watched-repos.json)
  • Devtools Watchlist (scripts/watched-devtools.json)

环境变量：
  DEEPSEEK_API_KEY   — DeepSeek 官方 API Key（生成周报时必须）
  DEEPSEEK_BASE_URL  — API 地址（默认 https://api.deepseek.com）
  DEEPSEEK_MODEL     — 模型名称（默认 deepseek-v4-flash）
  GITHUB_TOKEN     — GitHub API 认证（可选，提升速率限制）`);
}
