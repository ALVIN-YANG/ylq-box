---
title: "OMO：它是什么、怎么工作、怎么用"
description: "把 OMO 的定位、核心原理、主要 agents、安装方式和最常用的使用姿势讲清楚。基于官方 README，但改成更适合国内用户理解和上手的写法。"
sidebar:
  order: 3
---

# OMO：它是什么、怎么工作、怎么用

先说结论：**OMO 不是另一个终端工具，也不是单纯的 prompt 包。它本质上是一层压在 OpenCode 上面的多 Agent 工作流。**

很多人第一次看到 OMO，会先记住两个词：

1. `ultrawork`
2. 很猛的营销文案

但如果只停在这里，基本等于没理解它。

更准确的说法是：

```text
OpenCode 负责提供底座能力，OMO 负责把这些能力组织成一套更强的执行工作流。
```

官方链接：

- OpenCode 文档：<https://opencode.ai/docs>
- OMO 仓库：<https://github.com/code-yeongyu/oh-my-openagent>
- README：<https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/README.md>
- 安装文档：<https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md>

## 1. OMO 到底是什么

一句话理解：

```text
OMO = OpenCode 的强化工作流层
```

它想解决的问题是：

- 一个 Agent 同时负责规划、执行、搜索、验证，容易顾此失彼
- 复杂任务里，执行节奏不稳定
- 你要手动切模型、切角色、切方式，越来越累
- 很多 Agent 最终还是停在“建议层”，而不是“完成层”

## 2. 核心原理

如果把 README 里的 feature 名字都去掉，核心原理其实就 3 条：

1. 不让一个 Agent 独自做完所有事
2. 不让你手工决定每一步该用哪个模型
3. 不让任务停在“分析完毕，建议如下”

翻成大白话就是：

```text
分工 + 自动路由 + 持续推进
```

## 3. 官方 README 里最值得先抓住的点

### 官方推荐安装方式：直接丢给 agent

推荐直接发：

```text
Install and configure oh-my-opencode by following the instructions here:
https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md
```

### 最核心触发词：`ultrawork / ulw`

如果你装好了 OMO，最该先会用的就是这两个入口。

## 4. 主要 Agents 怎么理解

### Sisyphus

总控 Agent / 主执行调度者。

### Hephaestus

深工型 Agent，适合一路深入一个模块。

### Prometheus

planner，适合需求模糊、改动大、需要先确认边界的任务。

### Atlas

执行编排 / todo orchestration。

### Oracle

高阶咨询型 Agent，适合复杂 debug、架构判断、多系统 tradeoff。

### Explore

快搜代码仓库。

### Librarian

查文档、查库用法、查外部参考实现。

### Multimodal Looker

截图、图片、视觉输入相关。

## 5. 实际怎么用

### 复杂 bug 模板

```text
ulw
修好这个问题。不要停在建议层，先定位根因，再完成修改、验证和回归检查。
```

### 功能开发模板

```text
ulw
实现这个功能。先明确边界和风险，再拆成执行步骤，做完后跑测试和构建，最后总结改动。
```

### 先规划再执行模板

```text
先把这个需求的边界、风险和实现顺序梳理清楚，再开始做。不要先写代码。
```

## 6. 最容易踩的坑

1. 只记得它很猛，不知道从哪里开始用
2. 把它当问答插件
3. 提示词太碎
4. 还没把裸 OpenCode 跑顺就上 OMO

## 7. 最后一句话

```text
OMO 最值得记住的不是 feature 名，而是它把 AI Coding 从“能干活”推进成了“更像一个团队在干活”。
```
