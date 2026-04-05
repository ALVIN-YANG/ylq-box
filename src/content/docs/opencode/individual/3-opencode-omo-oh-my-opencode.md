---
title: "OpenCode + OMO：把 oh-my-opencode 用明白"
description: "把 OMO 的定位、安装、配置、Agent、ultrawork、项目落地方式一次讲清楚，尽量只留能直接上手的干货。"
sidebar:
  order: 3
---

# OpenCode + OMO：把 oh-my-opencode 用明白

如果只装裸 `OpenCode`，你得到的是一个很强的终端 Agent。

如果再叠上 **OMO（oh-my-opencode / oh-my-openagent）**，你得到的是一套更激进的工作流：

- 更明确的主 Agent / 子 Agent 分工
- 更强的任务编排和并行执行
- 更重的默认工程化约束
- 更丰富的命令、工具、钩子和技能

它不是“替代 OpenCode”，而是**压在 OpenCode 上面的一层工作流插件**。

先贴官方链接，后面都围绕这些内容展开：

- OpenCode 文档：<https://opencode.ai/docs>
- OMO 仓库：<https://github.com/code-yeongyu/oh-my-openagent>
- OMO 安装文档：<https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md>
- OMO 配置文档：<https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/reference/configuration.md>
- OMO 功能文档：<https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/reference/features.md>
- OMO 总览：<https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/overview.md>

---

## 1. 先把关系搞清楚

一句话理解：

```text
OpenCode = 底座
OMO = 强化工作流插件
```

分层可以这么看：

```text
你
 -> OpenCode
   -> OMO 插件层
     -> agent / hooks / skills / commands / MCP / orchestration
```

所以你日常看到的 `/agents`、`ultrawork`、规划 Agent、并行 Agent、LSP / AST 配套工具，很多并不是 OpenCode 原生全部自带的，而是 OMO 在上面整合出来的体验。

这也是它为什么火得快：

1. 不只是换个 prompt
2. 它更像一套“能直接干活”的 Agent harness
3. 目标不是让你研究配置，而是直接开工

---

## 2. 怎么装

最省事的方式，还是直接让 Agent 按官方文档装。

把下面整段复制给 OpenCode：

```text
Install and configure oh-my-opencode by following the instructions here:
https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md
```

装完后我建议至少做三件事：

1. 跑诊断

```bash
bunx oh-my-opencode doctor
```

2. 确认模型登录状态

```bash
opencode auth login
```

3. 开一个新会话，直接试最常见的入口词

```text
ultrawork
```

如果你不想自己逐行看安装文档，就记住一条原则：

```text
安装步骤以官方 raw 文档为准，使用方式再看这篇
```

---

## 3. OMO 到底多了什么

![OpenCode 与 OMO 的分层示意](/images/opencode/omo-architecture.svg)

和裸 OpenCode 比，OMO 最实用的增量我认为有 6 个：

### 3.1 Agent 分工更重

它不是只给你一个大模型，而是强调：

- 主 orchestrator 负责拆任务
- planner 负责想清楚
- deep worker 负责持续执行
- utility agent 负责探索、查资料、局部修复

这个思路的好处是：

```text
复杂任务不再全塞给一个 Agent 硬扛
```

### 3.2 模型按角色配，不是全局只配一个

比如：

- 规划型 Agent 用更强推理模型
- 深度执行 Agent 用更能连续工作的模型
- utility agent 用更快更便宜的模型

这是 OMO 比较实用的一点：**把贵模型花在该花的地方。**

### 3.3 命令层更厚

比如它主推的：

- `ultrawork`
- `ulw`
- 各类 slash commands

这些命令的价值不在“记命令”，而在于：

```text
你一句话触发一整套工作流，而不是一个个手工切 Agent
```

### 3.4 工具链更工程化

从上游文档和仓库能看到，它特别强调这些东西：

- LSP
- AST 级搜索 / 改写
- Hash 锚定编辑
- 背景 Agent
- session / history / hooks

### 3.5 默认更激进

它明显不是“轻柔辅助型”的风格，而是：

```text
给我目标，我尽量把整件事做完
```

### 3.6 更适合长期项目，不只是临时问答

OMO 真正舒服的场景不是“帮我写个函数”，而是：

- 让它接管一个 feature
- 让它按分工推进
- 让它保持一致的工程纪律

---

## 4. 先学会这几个核心概念

如果你第一次用 OMO，不要一上来就研究所有 docs。先搞懂这几个词。

### 4.1 Sisyphus / Hephaestus / Prometheus 是什么

按上游文档的定位，大致可以这么理解：

- **Sisyphus**：主 orchestrator，负责任务推进和调度
- **Hephaestus**：深度执行型 worker，适合自己一路干到底
- **Prometheus**：偏规划、偏盘清楚问题再动手

你可以把它们当成：

```text
项目经理 / 资深工程师 / 方案设计师
```

虽然真实实现更复杂，但对使用者来说，这个类比够用了。

### 4.2 `ultrawork` 是什么

这基本就是 OMO 最有代表性的入口。

你可以把它理解成：

```text
不要只回一句建议，给我把这件事往前推进
```

适合用在：

- 需求实现
- 排错
- 重构
- 多文件改动

### 4.3 配置文件怎么叠

项目里最常见的就是这两层：

- 用户级：`~/.config/opencode/`
- 项目级：`.opencode/`

规则还是：

```text
项目配置覆盖用户配置
```

### 4.4 兼容层命名

现在上游已经从 `oh-my-opencode` 逐步迁到 `oh-my-openagent`，但兼容层仍然会同时识别一些旧名字。

所以你会在不同文档里看到这些名字混用：

- `oh-my-opencode`
- `oh-my-openagent`

如果你看到两个名字，不要慌。当前主仓库就是：

<https://github.com/code-yeongyu/oh-my-openagent>

---

## 配置文件叠放

![用户配置与项目配置的覆盖关系](/images/opencode/omo-config-layers.svg)

规则：**先读用户目录，再读项目；项目覆盖用户。** macOS/Linux 常见：`~/.config/opencode/` 与仓库根下 `.opencode/`。插件配置名可能是 `oh-my-openagent.json(c)` 或旧名 `oh-my-opencode.json(c)`；**同一目录只留一份**，避免优先级糊涂。

我自己的建议是：

1. 用户目录放“通用习惯”
2. 项目目录放“项目特定规则”
3. 不要在两个地方重复定义同一件事

最容易维护的方式是：

- 用户级：模型偏好、通用技能、通用命令
- 项目级：仓库规则、项目 skill、项目 hooks

如果你要看完整字段，直接看官方配置文档：

<https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/reference/configuration.md>

---

## 5. 我建议你先会用这几种姿势

### 5.1 让它先规划，再执行

适合：

- 需求不清晰
- 改动大
- 容易改崩

用法上不要一上来就催它写代码，先让它盘清楚：

```text
先帮我拆一下这个需求，明确边界、风险和实现顺序，再开始做
```

这时 OMO 里偏 planner 的能力就更有价值。

### 5.2 让它接管完整任务

适合：

- 一整个 bug
- 一整个 feature
- 一次工程化整理

直接说目标，不要过早下细节指令：

```text
修好这个登录问题，补测试，跑构建，最后告诉我改了什么
```

### 5.3 让它并行探索

适合：

- 大仓库找线索
- 查多个文件
- 对比几种实现位置

### 5.4 让它只做一个局部深工

适合：

- 单文件大改
- 某个模块深入排查
- 连续几轮自修复

### 5.5 让它通过 SSH 跑在固定开发机上

这个场景我自己已经单独写过一篇：

- <https://ilovestudy.club/opencode/individual/4-macos-opencode-tailscale-termux/>

这是我现在最推荐的形态：

```text
把 OpenCode + OMO 固定装在一台主力 Mac 上
其他电脑和手机都 SSH 进去用
```

这样最稳，环境也最统一。

---

## 6. 终端里常用操作

1. **`/sessions`**：选对会话、别堆一堆空会话。  
2. **`/agents`**：切角色；核心 Agent 在 UI 里往往有 **Tab 顺序**（如 Sisyphus、Hephaestus、Prometheus、Atlas），养成固定手势。  
3. **`/models`**：没权限时先想 **Provider 登没登录**、当前 Agent 的**回退链**能不能走到你有的订阅。  

和「先 Plan 再 Build」一样：先让偏规划的 Agent 把事说清楚，再交给偏执行的，避免信息不全硬改代码。

---

## 7. OMO 适合什么人，不适合什么人

### 更适合的人

- 已经在用 OpenCode
- 想让 Agent 更主动
- 愿意接受“更重的工作流”
- 有长期项目，不是只写几个 demo

### 不太适合的人

- 只想要一个极轻量问答工具
- 不想学任何 Agent 分工
- 不接受它比裸 OpenCode 更强势

简单说：

```text
OMO 不是更轻，而是更重、更能打
```

---

## 8. 手机 / 平板

![SSH 从移动设备连到开发机跑 OpenCode](/images/opencode/omo-ssh.svg)

实用做法：**SSH 到已装好 OpenCode 的开发机**，在远端跑 `opencode`；OAuth 尽量在开发机本机浏览器完成，或按终端提示复制链接。外接键盘会省很多力气；别指望在手机本地从零搭编译环境。

---

## 9. 我自己的落地建议

如果你现在刚上手，我建议顺序不要乱。

### 第一步：先把裸 OpenCode 跑顺

至少做到：

- 能连模型
- 能读写文件
- 能跑命令
- 能稳定开新会话

### 第二步：再上 OMO

先别研究所有 Agent，重点体验：

- `ultrawork`
- planner / deep worker 的分工
- 项目级配置覆盖

### 第三步：只改你真的需要的配置

很多人一上来就想把所有模型、hooks、skills 全调一遍，最后只会把自己搞乱。

我更建议：

1. 默认先跑
2. 遇到明确问题再改
3. 每次只改一类配置

### 第四步：把它放到固定开发机

这一步体验提升最大。

原因很简单：

- 模型登录统一
- tool 环境统一
- repo 权限统一
- 手机和别的电脑都能复用

---

## 10. 使用上几条提示

- **Utility 类 Agent**（如 Explore、Librarian）文档里故意用快、便宜模型，**别强行换成大 Opus**，费钱不一定更好。  
- **Prometheus / Atlas** 可能对 Claude / GPT 用不同提示词风格，属设计如此。  
- **没有 Claude 订阅**时，文档会提醒 **Sisyphus** 体验可能明显偏弱——别指望靠调参完全补平。  
- 安装/依赖类报错：升级 OpenCode、换 `bunx`/`npx`、看 **doctor** 输出，比死记本文靠谱。

最后一句最实用：

```text
把 OMO 当成“更强势、更完整的一套 OpenCode 工作流”，不要把它当一个孤立插件看。
```
