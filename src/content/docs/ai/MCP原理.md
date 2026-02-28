---
title: AI 能力体系：从 Function Call 到 Agent
description: 全面解析 LLM 与外部世界交互的核心机制：Function Call 工具调用、Agent 智能体、MCP 协议、Skill 技能系统的原理与协作关系
---

大语言模型（LLM）本质上是一个文本生成器——输入文本，输出文本。它无法查数据库、调接口、读文件。要让 AI 真正「做事」，就需要一套让它与外部世界交互的机制。

本文从底层到上层，逐层讲解这套机制：

| 层级 | 概念 | 解决的问题 |
|------|------|-----------|
| 基础能力 | **Function Call** | LLM 如何调用外部函数 |
| 推理框架 | **Agent** | LLM 如何自主规划和多步执行 |
| 连接协议 | **MCP** | 工具和数据源如何标准化接入 |
| 领域封装 | **Skill** | 如何将专业能力打包复用 |

## Function Call（工具调用）

### 核心问题

LLM 的训练数据有截止日期，它不知道今天的天气、你的数据库里有什么、你的文件系统长什么样。**Function Call** 让模型能够声明「我需要调用某个函数来获取信息」，而不是凭空编造。

### 工作原理

Function Call 的流程分为 4 步：

```
用户提问 → 模型判断需要调用工具 → 外部系统执行 → 模型基于结果生成回答
```

**第 1 步：定义工具（Tool Definition）**

开发者通过 JSON Schema 告诉模型有哪些工具可用：

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "获取指定城市的当前天气",
    "parameters": {
      "type": "object",
      "properties": {
        "location": { "type": "string", "description": "城市名称" }
      },
      "required": ["location"]
    }
  }
}
```

**第 2 步：模型决策调用（Tool Call）**

用户问「上海天气怎么样？」，模型不会直接回答，而是返回一个结构化的调用请求：

```json
{
  "tool_calls": [{
    "id": "call_abc123",
    "function": {
      "name": "get_weather",
      "arguments": "{\"location\": \"上海\"}"
    }
  }]
}
```

关键点：**模型自己不执行函数**，它只负责决定调用哪个函数、传什么参数。

**第 3 步：外部执行（Tool Output）**

你的代码收到调用请求后，实际执行 `get_weather("上海")`，拿到结果后返回给模型：

```json
{
  "role": "tool",
  "tool_call_id": "call_abc123",
  "content": "{\"temperature\": 26, \"condition\": \"多云\", \"humidity\": 72}"
}
```

**第 4 步：生成最终回答**

模型将工具结果结合上下文，生成自然语言回答：「上海目前 26°C，多云，湿度 72%。」

### 完整数据流

```
┌──────────┐     ①定义工具      ┌──────────┐
│          │ ──────────────────→ │          │
│          │     ②用户提问      │          │
│  你的    │ ──────────────────→ │   LLM    │
│  应用    │     ③工具调用请求   │  (模型)  │
│          │ ←────────────────── │          │
│          │     ⑤工具执行结果   │          │
│          │ ──────────────────→ │          │
│          │     ⑥最终回答      │          │
│          │ ←────────────────── │          │
└──────────┘                    └──────────┘
      │④ 调用外部 API/数据库
      ▼
┌──────────┐
│ 外部服务  │
└──────────┘
```

### 要点

- 模型只做「决策」（调用什么、传什么参数），**不做执行**
- 一次对话中可以调用多个工具，也可以多轮调用
- `strict: true` 模式下（OpenAI Structured Outputs），模型生成的参数严格遵循 JSON Schema，不会出现格式错误
- Function Call 是所有后续概念（Agent、MCP）的底层基础

## Agent（智能体）

### 核心问题

Function Call 只解决了「一步调用」的问题。但真实任务通常需要多步推理：先搜索文件、再读取内容、分析问题、修改代码、最后运行测试。**Agent** 就是让 LLM 能自主规划和多步执行的推理框架。

### ReAct 模式

主流 Agent 实现基于 **ReAct**（Reasoning + Acting）模式，核心是一个循环：

```
思考(Thought) → 行动(Action) → 观察(Observation) → 思考 → ... → 最终回答
```

以「帮我修复这个 bug」为例：

| 步骤 | 阶段 | 内容 |
|------|------|------|
| 1 | Thought | 用户报告了一个 bug，我需要先定位错误发生在哪个文件 |
| 2 | Action | 调用 `grep` 搜索错误关键字 |
| 3 | Observation | 在 `src/utils.ts` 第 42 行找到了相关代码 |
| 4 | Thought | 找到了，这里的数组越界是因为没有做边界检查 |
| 5 | Action | 调用 `edit_file` 修改代码，添加边界检查 |
| 6 | Observation | 文件已修改 |
| 7 | Thought | 修改完成，应该运行测试确认 |
| 8 | Action | 调用 `run_tests` 执行测试 |
| 9 | Observation | 所有测试通过 |
| 10 | Answer | Bug 已修复，在第 42 行添加了数组边界检查 |

### Agent 与 Function Call 的关系

```
┌─────────────────────────────────────────┐
│                Agent                     │
│                                         │
│  ┌─────────┐    ┌─────────────────────┐ │
│  │ 推理引擎 │───→│  Function Call ×N   │ │
│  │ (ReAct) │←───│  (每一步的工具调用)  │ │
│  └─────────┘    └─────────────────────┘ │
│       │                                  │
│  ┌─────────┐    ┌─────────────────────┐ │
│  │  记忆   │    │    上下文管理        │ │
│  └─────────┘    └─────────────────────┘ │
└─────────────────────────────────────────┘
```

- **Function Call** 是单次工具调用的能力
- **Agent** 是在此基础上增加了 **推理循环 + 记忆 + 上下文管理**
- Agent 的每一个 Action 步骤底层都是 Function Call

### 典型 Agent 实现

| 产品 | 场景 | 工具集 |
|------|------|--------|
| Cursor Agent | 代码编辑 | 读写文件、搜索代码、运行终端、浏览器 |
| Claude Code | CLI 编程 | Shell、文件系统、Git |
| ChatGPT + Code Interpreter | 数据分析 | Python 执行、文件上传下载 |
| AutoGPT / CrewAI | 自动化工作流 | 浏览器、API 调用、多 Agent 协作 |

## MCP（Model Context Protocol）

### 核心问题

Agent 需要接入各种工具和数据源：数据库、文件系统、Sentry、GitHub、Slack……每个 AI 应用都自己写一套接入逻辑？这就是 **N×M 问题**：N 个 AI 应用 × M 个工具 = N×M 个适配器。

MCP 解决的就是这个问题：**定义一个标准协议，让任何 AI 应用都能连接任何工具**。

```
没有 MCP：                      有了 MCP：

App1 ──→ Tool A                 App1 ─┐
App1 ──→ Tool B                 App2 ─┤
App2 ──→ Tool A                 App3 ─┘
App2 ──→ Tool B                   │
App3 ──→ Tool A               MCP 协议
App3 ──→ Tool B                   │
                              ┌───┴───┐
N×M 个适配器                Tool A  Tool B

                              N+M 个适配器
```

### MCP 是什么

MCP（Model Context Protocol）是 Anthropic 发布的开放协议，定位类似于编程语言领域的 **LSP**（Language Server Protocol）：

- LSP 让任何编辑器对接任何语言的智能提示
- MCP 让任何 AI 应用对接任何工具和数据源

### 架构：Host → Client → Server

```
┌──────────────────────────────────────┐
│          MCP Host (AI 应用)           │
│   如：Cursor / Claude Desktop / IDE   │
│                                       │
│  ┌─────────┐  ┌─────────┐           │
│  │ Client 1 │  │ Client 2 │  ...     │
│  └────┬─────┘  └────┬─────┘          │
└───────│──────────────│────────────────┘
        │              │
   1:1 连接        1:1 连接
        │              │
   ┌────▼─────┐  ┌────▼──────┐
   │ Server A  │  │ Server B   │
   │ (本地文件) │  │ (Sentry)   │
   └──────────┘  └───────────┘
```

三个角色：

| 角色 | 职责 | 例子 |
|------|------|------|
| **Host** | AI 应用，管理多个 Client | Cursor、Claude Desktop、VS Code |
| **Client** | Host 内部组件，维护与某个 Server 的连接 | Host 为每个 Server 创建一个 Client |
| **Server** | 提供工具、数据、Prompt 的服务 | 文件系统 Server、数据库 Server、GitHub Server |

### MCP Server 提供的三种能力

MCP Server 通过三种**原语（Primitives）**向 Client 暴露能力：

**1. Tools（工具）**

让 AI 执行操作，如查询数据库、调用 API、操作文件：

```json
{
  "name": "query_database",
  "description": "执行 SQL 查询",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sql": { "type": "string", "description": "SQL 语句" }
    },
    "required": ["sql"]
  }
}
```

**2. Resources（资源）**

向 AI 提供上下文数据，如文件内容、数据库 Schema、配置信息：

```
resources/list → 列出所有可用资源
resources/read → 读取某个资源的内容
```

**3. Prompts（提示模板）**

预定义的交互模板，如 few-shot 示例、系统提示词：

```
prompts/list → 列出可用模板
prompts/get  → 获取模板内容
```

### 通信协议

MCP 基于 **JSON-RPC 2.0** 通信，支持两种传输方式：

| 传输方式 | 场景 | 特点 |
|---------|------|------|
| **stdio** | 本地 Server | 通过标准输入输出通信，零网络开销 |
| **Streamable HTTP** | 远程 Server | HTTP POST + SSE 流式响应，支持 OAuth 认证 |

### 连接生命周期

```
Client                          Server
  │                               │
  │── initialize ────────────────→│  能力协商（双方声明支持的功能）
  │←──────────── init result ─────│
  │                               │
  │── notifications/initialized ─→│  就绪通知
  │                               │
  │── tools/list ────────────────→│  发现工具
  │←──────────── tools list ──────│
  │                               │
  │── tools/call ────────────────→│  调用工具
  │←──────────── call result ─────│
  │                               │
  │←── notifications/tools/ ──────│  工具变更通知（实时推送）
  │      list_changed             │
```

### 配置示例

以 Cursor 中配置 MCP Server 为例（`.cursor/mcp.json`）：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_xxxx" }
    }
  }
}
```

配置后，Cursor 的 Agent 就能通过这些 MCP Server 读写文件、查询 GitHub Issue 等。

## Skill（技能）

### 核心问题

Agent 有了工具，但面对特定领域任务时仍需要「专业知识」。比如：创建 React 组件时应该遵循什么规范？部署到 AWS 时具体步骤是什么？**Skill** 就是将领域专业知识打包成可复用的指令集，让 Agent 在特定场景下表现得像专家。

### 与 Function Call 的区别

| 对比项 | Function Call / Tool | Skill |
|--------|---------------------|-------|
| 本质 | 可执行的函数 | 知识 + 流程指导 |
| 触发方式 | 模型判断需要调用 | 上下文匹配或手动调用 |
| 内容 | 代码实现 | Markdown 指令文档 |
| 例子 | `read_file(path)` | 「如何创建 Cursor Rule」的完整步骤 |

### Cursor Skill 机制

以 Cursor IDE 的 Agent Skill 为例，它的工作方式：

**目录结构**

```
~/.cursor/skills/          # 全局 Skill
.cursor/skills/            # 项目级 Skill
.agents/skills/            # 项目级 Skill

my-skill/
├── SKILL.md               # 技能定义（必须）
├── scripts/               # 辅助脚本（可选）
├── references/            # 参考文档（可选）
└── assets/                # 资源文件（可选）
```

**SKILL.md 格式**

```markdown
---
name: create-react-component
description: 创建符合团队规范的 React 组件。当用户要求创建新组件时使用。
---

## 使用场景
当用户要求创建新的 React 组件时自动激活。

## 步骤
1. 在 src/components/ 下创建组件目录
2. 使用 TypeScript + FC 模式
3. 导出 Props 类型
4. 创建对应的测试文件
...
```

**自动激活 vs 手动调用**

- 默认：Agent 根据上下文自动判断是否使用某个 Skill
- 设置 `disable-model-invocation: true` 后：仅在用户输入 `/skill-name` 时激活

### Cursor Rule 系统

与 Skill 类似，Cursor 还有 **Rule** 系统（`.cursor/rules/` 下的 `.mdc` 文件），用于为 Agent 提供持久化的编码规范和项目约定。Rule 更偏向于「始终遵守的规则」，Skill 更偏向于「特定任务的操作指南」。

## 四者的协作关系

把这些概念放在一起，看一个完整的交互流程——以 Cursor Agent 帮你修改代码为例：

```
用户: "帮我给 UserService 添加缓存"

┌─ Cursor Agent (Host) ──────────────────────────────────┐
│                                                         │
│  1. Rule 加载                                           │
│     读取 .cursor/rules/ → 「本项目使用 Redis 缓存」       │
│                                                         │
│  2. Skill 匹配                                          │
│     匹配到 add-caching Skill → 提供缓存实现的最佳实践      │
│                                                         │
│  3. Agent 推理（ReAct 循环）                              │
│     ├── Thought: 需要先了解 UserService 的结构            │
│     ├── Action: 通过 MCP 调用 → read_file(UserService)   │
│     ├── Observation: 拿到文件内容                         │
│     ├── Thought: 需要在 getUser 方法添加 Redis 缓存       │
│     ├── Action: 通过 MCP 调用 → edit_file(...)           │
│     ├── Observation: 文件已修改                           │
│     ├── Action: 通过 MCP 调用 → run_terminal(npm test)   │
│     └── Answer: 已完成，添加了 Redis 缓存...              │
│                                                         │
│  底层：每个 Action 都是一次 Function Call                  │
│  连接：每个工具都通过 MCP 协议标准化接入                    │
└─────────────────────────────────────────────────────────┘
```

## 总结

| 概念 | 一句话 | 类比 |
|------|--------|------|
| **Function Call** | LLM 声明「我要调这个函数」的能力 | 手——能拿工具 |
| **Agent** | 让 LLM 自主推理、多步执行的框架 | 大脑——规划用什么工具、按什么顺序 |
| **MCP** | 工具接入的标准化协议 | USB 接口——统一连接标准 |
| **Skill** | 特定领域的专家知识包 | 操作手册——告诉大脑具体怎么做 |

**从下到上的依赖关系：**

```
Skill（领域知识指导）
  ↓ 指导
Agent（推理规划）
  ↓ 驱动
MCP（标准化连接）
  ↓ 封装
Function Call（单次工具调用）
  ↓ 执行
外部工具 / API / 数据
```

## 延伸阅读

- [OpenAI Function Calling 文档](https://developers.openai.com/api/docs/guides/function-calling)
- [MCP 官方规范](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP 架构概览](https://modelcontextprotocol.io/docs/learn/architecture)
- [MCP Server 列表](https://github.com/modelcontextprotocol/servers)
- [Cursor Agent Skills 文档](https://cursor.com/docs/context/skills)
- [Cursor Rules 文档](https://cursor.com/docs/context/rules)
- [ReAct: Synergizing Reasoning and Acting in Language Models（论文）](https://arxiv.org/abs/2210.03629)
