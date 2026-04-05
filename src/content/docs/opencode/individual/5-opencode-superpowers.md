---
title: "OpenCode + superpowers：简单、实用、能落地的用法"
description: "superpowers 不是模型，也不是替代 OpenCode。它更像一套自动触发的开发方法论。重点讲怎么和 OpenCode 配合用。"
sidebar:
  order: 5
---

# OpenCode + superpowers：简单、实用、能落地的用法

如果说 OMO 偏“更强的 Agent harness”，那 **superpowers** 更像是：

```text
把一套工程方法论直接塞进你的 Agent
```

它不是帮你“换一个模型”，而是尽量把下面这些事情标准化：

- 先问清楚需求
- 先做设计
- 再写计划
- 再执行
- 中间做 review
- 最后验证和收尾

官方链接先放这：

- 仓库：<https://github.com/obra/superpowers>
- OpenCode 安装入口：<https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md>
- OpenCode 说明：<https://github.com/obra/superpowers#opencode>

---

## 1. 它到底是什么

superpowers 的核心不是“命令很多”，而是**skill 自动触发**。

按仓库说明，它会把一套流程自动嵌进你的工作流里，比如：

- brainstorming
- writing-plans
- test-driven-development
- requesting-code-review
- finishing-a-development-branch

翻成大白话：

```text
不是你每次都记得先设计、再计划、再 review
而是它尽量逼 Agent 按这个顺序干
```

这类东西很适合长期开发，不太适合“随便问一句就走”的轻场景。

---

## 2. 怎么装到 OpenCode

还是最省事的方式：直接把官方安装文档丢给 OpenCode。

把这段发给 OpenCode：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

这是 superpowers 官方 README 里专门给 OpenCode 的安装入口。

---

## 3. 它最适合什么场景

我觉得 superpowers 最适合三类任务。

### 3.1 做一个完整功能

比如：

```text
给后台增加一个订单退款审批流，先梳理需求，再给实施计划，最后按计划完成
```

这个时候它的价值很明显：

- 不容易直接跳进代码乱写
- 会更强调先把边界讲清楚
- 更适合中长任务

### 3.2 修一个复杂 bug

比如：

```text
排查线上偶发超时，先确认复现条件，再定位根因，再给修复方案
```

这时它偏“系统化排错”的能力会比直接瞎试更稳。

### 3.3 多人协作仓库

如果仓库本身就比较讲规范，superpowers 的方法论更容易对齐团队习惯。

---

## 4. 它和 OMO 的区别

很多人第一次看会混。

最简单的区分方式：

### OMO 更偏“Agent harness / 编排 / 强执行”

重点在：

- Agent 分工
- orchestration
- 多模型和工具整合
- 更重的执行推进

### superpowers 更偏“工程方法论 / 自动化流程”

重点在：

- brainstorming
- design
- writing-plans
- TDD
- review
- finishing workflow

一句话：

```text
OMO 更像强化执行框架
superpowers 更像强化开发纪律
```

---

## 5. 我建议怎么和 OpenCode 一起用

我更推荐把它当成“主流程约束层”，不是啥都交给它。

### 用法 1：需求不清楚时，先让它逼你说清楚

直接这样说：

```text
我想做一个 XX 功能，你先帮我把需求边界和实现方案梳理清楚，不要急着写代码
```

### 用法 2：设计过了，再让它拆计划

```text
方案确认了，帮我拆成可执行的小任务，按顺序给出实施计划
```

### 用法 3：最后再让 OpenCode / Agent 去执行

```text
按这个计划开始做，做完跑测试和构建，再给我总结改动
```

这个组合最稳。

---

## 6. 我不建议怎么用

### 不建议一上来就让它接管所有简单任务

比如只是改个文案、修个样式、改个小 bug，这种任务如果先 brainstorming 再 planning，反而太重。

### 不建议把它和另一个强工作流插件同时全量开启

比如你同时深度依赖 OMO 和 superpowers，而且两边都希望接管：

- 规划
- 命令
- 会话节奏
- skill 自动触发

那就容易打架。

更稳的方式是：

```text
选一个主工作流
另一个只保留你真正要的部分
```

---

## 7. 最实用的落地建议

如果你是个人开发者，或者就你自己主导仓库，我建议这么用：

1. OpenCode 负责基础执行
2. superpowers 只在复杂需求、复杂 bug、较大重构时启用
3. 小任务直接让 OpenCode 干，不要每次都走完整流程

也就是说：

```text
把 superpowers 当成重型模式，而不是默认模式
```

这样最不容易累。

---

## 8. 最短记法

如果你只想记一句：

```text
OpenCode 负责干活，superpowers 负责让干活这件事更像一个靠谱工程团队。
```

安装入口再贴一次：

<https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md>
