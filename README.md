# Alvin Yang

这是一个基于 [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) 构建的个人技术站点，主要记录 AI、系统架构、云原生与工程实践相关内容。全局主题与正文样式（含中英混排字体与 Markdown 加粗）在 `src/styles/custom.css` 中维护。

站点地址：[https://ilovestudy.club](https://ilovestudy.club)

项目当前包含这些主要内容：

- 技术文章与专题笔记（含 `src/content/docs/opencode/individual/` 下 OpenCode、Oh My OpenCode 等专栏——其中 OMO 篇提供上游 [installation.md](https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md) 与可复制 Agent 话术；`src/content/docs/ai/` 下 AI 专栏配图均在 `public/images/ai/`，示意类内容优先用手写 SVG，避免大段 ASCII 框图）
- AI News 自动化资讯页
- Model Arena 模型对比页
- 适配桌面与移动端的文档站体验

## 版本控制说明

以下路径由 `.gitignore` 排除，不纳入仓库：

- `.idea/`：JetBrains IDE 本地配置
- `.opencode/`：Opencode 本地数据
- `/docs/`：仓库根目录下的本地文档目录（与 `src/content/docs` 站点内容区分；`.gitignore` 使用 `/docs/` 避免误匹配 Starlight 内容路径）
- `run.log`、`dev.log`：运行日志
- `yarn.lock`：本项目以 `package-lock.json` 作为依赖锁定文件；若使用 Yarn，锁文件仅保留在本地
