---
title: "OpenCode + OMO：使用技巧"
description: "OMO 与 OpenCode 的分工、官方安装话术、配置叠放、斜杠命令与 SSH 移动场景。"
sidebar:
  order: 3
---

# OpenCode + OMO：使用技巧

**OpenCode** 负责连模型、调工具、改文件；**Oh My OpenCode（OMO）** 是插件层，把活分给不同 Agent，并带 Hooks、任务等能力（细节见上游文档）。安装与鉴权**只跟官方走**，下面给一句话术；本文主要写**怎么用**。

**文档链接：** [OpenCode](https://opencode.ai/docs) · [OMO 安装（raw）](https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md) · [OMO 配置参考](https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/docs/reference/configuration.md) · [仓库](https://github.com/code-yeongyu/oh-my-openagent) · [ohmyopencode.com](https://ohmyopencode.com/)

---

## 安装

把下面**整段**复制到 OpenCode（或任意终端 Agent），按文档逐步执行即可：

```text
Install and configure oh-my-opencode by following the instructions here:
https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md
```

装完后建议跑一次 `bunx oh-my-opencode doctor`；登录各模型商按文档走 `opencode auth login`。参数、订阅、`--no-tui` 等**一律以该 raw 页面为准**，此处不重复。

---

## 分层关系（一眼）

![OpenCode 与 OMO 的分层示意](/images/opencode/omo-architecture.svg)

和「裸 OpenCode」相比，你多的是：**多 Agent 分工**、**按 Agent 配的模型链**（不是全局单模型）、以及配置里写的 **Hooks / 任务** 等——不用一次啃完，先跑起来再按需改。

---

## 配置文件叠放

![用户配置与项目配置的覆盖关系](/images/opencode/omo-config-layers.svg)

规则：**先读用户目录，再读项目；项目覆盖用户。** macOS/Linux 常见：`~/.config/opencode/` 与仓库根下 `.opencode/`。插件配置名可能是 `oh-my-openagent.json(c)` 或旧名 `oh-my-opencode`；**同一目录只留一份**，避免优先级糊涂。JSONC 可写注释；`$schema` 见 [configuration 文档](https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/docs/reference/configuration.md)。

---

## 终端里常用操作

1. **`/sessions`**：选对会话、别堆一堆空会话。  
2. **`/agents`**：切角色；核心 Agent 在 UI 里往往有 **Tab 顺序**（如 Sisyphus、Hephaestus、Prometheus、Atlas），养成固定手势。  
3. **`/models`**：没权限时先想 **Provider 登没登录**、当前 Agent 的**回退链**能不能走到你有的订阅。  

和「先 Plan 再 Build」一样：先让偏规划的 Agent 把事说清楚，再交给偏执行的，避免信息不全硬改代码。

---

## 手机 / 平板

![SSH 从移动设备连到开发机跑 OpenCode](/images/opencode/omo-ssh.svg)

实用做法：**SSH 到已装好 OpenCode 的开发机**，在远端跑 `opencode`；OAuth 尽量在开发机本机浏览器完成，或按终端提示复制链接。外接键盘会省很多力气；别指望在手机本地从零搭编译环境。

---

## 使用上几条提示

- **Utility 类 Agent**（如 Explore、Librarian）文档里故意用快、便宜模型，**别强行换成大 Opus**，费钱不一定更好。  
- **Prometheus / Atlas** 可能对 Claude / GPT 用不同提示词风格，属设计如此。  
- **没有 Claude 订阅**时，文档会提醒 **Sisyphus** 体验可能明显偏弱——别指望靠调参完全补平。  
- 安装/依赖类报错：升级 OpenCode、换 `bunx`/`npx`、看 **doctor** 输出，比死记本文靠谱。
