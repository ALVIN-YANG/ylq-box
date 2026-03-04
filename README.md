# Alvin Yang

基于 [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) 的个人技术站点，聚焦 AI Agent 开发、云原生与全栈工程实践。

**站点地址**：https://ilovestudy.club

## 技术栈

- **框架**：Astro 5 + Starlight
- **语言**：TypeScript / Markdown
- **部署**：Netlify（CI/CD 自动构建）
- **样式**：自定义暗色/亮色双主题（Inter + JetBrains Mono 字体，Google Fonts 加载）
- **PWA**：通过 @vite-pwa/astro 集成，支持离线访问、添加到主屏幕、Service Worker 自动更新

## 项目结构

```
src/
├── components/
│   ├── CustomHeader.astro   # 自定义导航栏（毛玻璃背景、当前页高亮）
│   ├── Sidebar.astro        # 自定义侧边栏（按栏目过滤、AI News 周报/日报分组）
│   ├── RecentNotes.astro    # 首页最近笔记卡片（AI 内容优先、分类标签、hover 微动效）
│   ├── Hero.astro           # 自定义 Hero 组件（粒子网络背景动效）
│   ├── HeroAnimation.astro  # Canvas 粒子动画（跟随主题切换颜色）
│   ├── ThemeToggle.astro    # 明暗主题切换按钮（图标式，替代 Starlight 默认下拉框）
│   └── Footer.astro         # 自定义页脚（版权信息、Starlight 致谢）
├── content/
│   └── docs/
│       ├── index.mdx        # 站点首页（Splash 布局）
│       ├── java/            # Java 技术栈
│       ├── ops/             # 运维（Kubernetes）
│       ├── network/         # 网络（IP、Git 配置等）
│       ├── ai/              # AI（提示词工程、RAG、Function Call/Agent 等）
│       ├── architecture/    # 架构设计（分布式事务）
│       ├── ai-news/         # AI 技术日报（Trending + 论文 + Release + Devtools + RSS，自动生成）
│       ├── model-arena/     # Model Arena 仪表盘（Arena 排名 + 定价 + 时间线，自动生成）
│       └── blog/            # 博客文章
├── styles/
│   └── custom.css           # 全局双主题样式（暗色暖灰 + 亮色奶白）
scripts/
├── fetch-ai-news.mjs       # AI News 自动生成脚本（五数据源采集 + LLM 总结）
├── fetch-model-arena.mjs   # Model Arena 仪表盘生成脚本（lmarena.ai 排名 + 配置数据）
├── watched-repos.json       # 可配置的 AI 框架 Release 追踪项目列表
├── watched-devtools.json    # 可配置的 AI 开发者工具 Release 追踪列表
├── model-pricing.json       # 主流模型 API 定价数据
└── model-releases.json      # 模型发布时间线数据（降级兜底，正常从 aiflashreport.com 自动抓取）
public/
├── favicon.svg              # 站点图标（SVG）
├── pwa-192x192.png          # PWA 图标 192×192
├── pwa-512x512.png          # PWA 图标 512×512
└── apple-touch-icon.png     # iOS 主屏幕图标 180×180
```

## 本地开发

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器 (localhost:4321)
npm run build      # 构建生产版本到 dist/
npm run preview    # 本地预览构建结果
```

## 内容编写

在 `src/content/docs/` 下对应目录中添加 `.md` 或 `.mdx` 文件，Starlight 会自动生成路由和侧边栏。
首页 `src/content/docs/index.mdx` 使用 Splash 模板，Hero 区突出 AI Agent 方向定位，下方展示最近笔记卡片（AI 内容优先）。

每篇文档需要包含 frontmatter：

```yaml
---
title: 文档标题
description: 简短描述（可选，用于 SEO 和卡片展示）
---
```

## AI News 自动化

面向 AI 工程师的技术日报，通过 GitHub Actions 定时采集五类数据源，LLM 自动总结生成。

### 数据源

| 模块 | 来源 | 说明 |
|------|------|------|
| Trendshift | [trendshift.io](https://trendshift.io/) 数据解析 | 每日社区热门 AI 开源项目，基于参与度评分算法 |
| HF Daily Papers | [Hugging Face Daily Papers API](https://huggingface.co/papers) | 社区投票筛选的高质量 AI 论文，按 upvotes 排序 |
| Release Watchlist | GitHub API | AI 框架项目列表（`scripts/watched-repos.json`），追踪 48h 内新版本 |
| Devtools Watchlist | GitHub API | AI 开发者工具列表（`scripts/watched-devtools.json`），追踪 48h 内新版本 |
| RSS Feeds | HN AI、TechCrunch AI、HF Blog、Simon Willison、Cursor Blog | 行业动态 + 技术博客 |

### 输出栏目

- **开源热门** — GitHub Trending AI 项目（3~5 个）
- **论文精选** — 当日高票 AI 论文，重点关注 Agent/RAG/推理方向（3~5 篇）
- **版本更新** — AI 框架关注列表中的新 Release（无更新时省略）
- **开发者工具** — AI 编码工具的版本更新（无更新时省略）
- **行业动态** — 筛选后的行业新闻与技术博文（5~8 条）

### 管理关注项目

编辑 `scripts/watched-repos.json`（AI 框架）和 `scripts/watched-devtools.json`（开发者工具）即可增减追踪的项目：

```json
[
  { "repo": "openclaw/OpenClaw", "alias": "OpenClaw" },
  { "repo": "langchain-ai/langchain", "alias": "LangChain" }
]
```

### 设置步骤

1. 在 GitHub 仓库的 **Settings → Secrets → Actions** 中添加：
   - `OPENAI_API_KEY`（必须）—— OpenAI API Key
   - `OPENAI_BASE_URL`（可选）—— 自定义 API 地址，支持代理或兼容接口（如 DeepSeek）
   - `OPENAI_MODEL`（可选）—— 模型名称，默认 `gpt-4o-mini`
   - `GITHUB_TOKEN` 由 Actions 自动提供，无需手动配置

2. 推送代码后，GitHub Actions 会自动：
   - **每天 08:00（北京时间）**：生成每日技术速递
   - **每周日 09:00（北京时间）**：生成每周深度周报

3. 也可以在 GitHub Actions 页面手动触发（workflow_dispatch）

### 本地手动运行

```bash
export OPENAI_API_KEY=sk-xxx

npm run news:daily              # 生成每日速递
npm run news:weekly             # 生成每周总结
node scripts/fetch-ai-news.mjs --daily --force   # 强制覆盖
```

未设置 `OPENAI_API_KEY` 时，脚本降级为原始数据输出。所有数据源独立运行，单个失败不影响其他模块。

## Model Arena 仪表盘

AI 模型综合对比页面，以表格形式展示 Arena 排名、API 定价和发布时间线。

### 数据源

| 模块 | 来源 | 说明 |
|------|------|------|
| Arena 排名 | [lmarena.ai](https://lmarena.ai/leaderboard) RSC 解析 | 综合对话、代码/Web 开发、视觉理解三个维度的 ELO 排名 |
| API 定价 | `scripts/model-pricing.json` | 手动维护，覆盖 20+ 主流模型 |
| 发布时间线 | [aiflashreport.com/model-releases](https://aiflashreport.com/model-releases) | 自动抓取，含模型类型、关键特性、Benchmark 指标 |

### 自动更新

通过 GitHub Actions 每 **3 天**自动运行一次（`.github/workflows/model-arena.yml`），也可手动触发。

### 本地生成

```bash
node scripts/fetch-model-arena.mjs --force   # 生成/更新仪表盘数据
```

Arena 排名和发布时间线均自动从线上抓取，定价数据从本地 JSON 配置读取。抓取失败时自动降级为本地 `model-releases.json`。

## 部署

推送到 Git 后，Netlify 自动触发构建和部署（配置见 `netlify.toml`）。
