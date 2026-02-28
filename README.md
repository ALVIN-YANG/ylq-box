# YLQ Box

基于 [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) 的个人技术文档站点，用于记录和分享技术笔记与博客。

**站点地址**：https://ilovestudy.club

## 技术栈

- **框架**：Astro 5 + Starlight
- **语言**：TypeScript / Markdown
- **部署**：Netlify（CI/CD 自动构建）
- **样式**：自定义 Slate 暗色主题（Inter + JetBrains Mono 字体）

## 项目结构

```
src/
├── components/
│   ├── CustomHeader.astro   # 自定义导航栏（搜索、分类链接、社交图标）
│   └── RecentNotes.astro    # 首页最近笔记卡片
├── content/
│   └── docs/
│       ├── index.mdx        # 站点首页（Splash 布局）
│       ├── java/            # Java 技术栈
│       │   ├── 1-language/      # Java 语言基础（Optional）
│       │   ├── 2-concurrent/    # 并发编程（多线程）
│       │   ├── 3-springboot/    # Spring Boot
│       │   ├── 4-mybatis/       # MyBatis 持久层
│       │   ├── 5-maven/         # Maven 构建与发布
│       │   ├── 6-architecture/  # 架构设计（分布式事务）
│       │   └── 7-devtools/      # 开发工具（IDEA 调试）
│       ├── ops/             # 运维（Kubernetes）
│       ├── network/         # 网络（IP、Git 配置等）
│       ├── ai/              # AI（Function Call、Agent、MCP 原理等）
│       ├── ai-news/         # AI News（每日速递 + 每周总结，自动生成）
│       └── blog/            # 博客文章
├── styles/
│   └── custom.css       # 全局 Slate 暗色主题
└── content.config.ts    # Starlight 内容集合配置
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
首页 `src/content/docs/index.mdx` 使用 Splash 模板，标题下方快捷入口当前指向 `AI` 与 `AI News`。

每篇文档需要包含 frontmatter：

```yaml
---
title: 文档标题
description: 简短描述（可选，用于 SEO 和卡片展示）
---
```

## AI News 自动化

通过 GitHub Actions 定时抓取 AI 领域 RSS 新闻，调用 LLM API 自动总结并生成文章。

### 设置步骤

1. 在 GitHub 仓库的 **Settings → Secrets → Actions** 中添加：
   - `OPENAI_API_KEY`（必须）—— OpenAI API Key
   - `OPENAI_BASE_URL`（可选）—— 自定义 API 地址，支持代理或兼容接口（如 DeepSeek）
   - `OPENAI_MODEL`（可选）—— 模型名称，默认 `gpt-4o-mini`
   - 注意：`OPENAI_MODEL` 的命名需要和 `OPENAI_BASE_URL` 对应服务商保持一致，否则可能出现 `unexpected model name format`（400）

2. 推送代码后，GitHub Actions 会自动：
   - **每天 08:00（北京时间）**：生成每日速递
   - **每周日 09:00（北京时间）**：生成每周总结

3. 也可以在 GitHub Actions 页面手动触发（workflow_dispatch）：
   - `mode`: 选择 `daily` 或 `weekly`
   - `force`: 选择 `true` 时，会强制覆盖已存在的当日/当周文件（不会再跳过）

### 本地手动运行

```bash
# 设置环境变量
export OPENAI_API_KEY=sk-xxx

# 生成今天的每日速递
npm run news:daily

# 生成本周周报
npm run news:weekly

# 强制覆盖已存在文件（用于重跑）
node scripts/fetch-ai-news.mjs --daily --force
node scripts/fetch-ai-news.mjs --weekly --force
```

不设置 `OPENAI_API_KEY` 时，脚本会降级为直接输出 RSS 原始列表（不经过 LLM 总结）。
当 LLM 接口调用失败（例如模型名格式不匹配、网关超时）时，脚本同样会自动降级输出原始列表，不会导致任务整体失败。
每日速递和周报正文开头会包含“生成时间”（北京时间 + UTC），便于核对重跑结果。

## 部署

推送到 Git 后，Netlify 自动触发构建和部署（配置见 `netlify.toml`）。
