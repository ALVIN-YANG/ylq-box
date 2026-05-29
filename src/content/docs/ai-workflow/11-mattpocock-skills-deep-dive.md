---
title: "Matt Pocock Skills：让 AI 编程回归工程本质的组合技"
description: "不是 prompt 包，不是 vibe coding 的助推器。这是一套基于数十年工程经验、可组合、可适配的 AI 编程实践。从 /grill-me 到 /tdd，从 CONTEXT.md 到 ADR，拆解每个 skill 的设计意图、正确使用姿势和组合工作流。"
sidebar:
  order: 11
---

# Matt Pocock Skills：让 AI 编程回归工程本质的组合技

> 仓库地址：<https://github.com/mattpocock/skills>
> 订阅更新：<https://www.aihero.dev/s/skills-newsletter>

先说结论：**这不是又一个 prompt 集合，也不是 vibe coding 的加速器。Matt Pocock 的 skills 是一套用工程纪律对抗 AI 编程熵增的组合拳。**

它的核心假设很简单：AI 没有消灭软件工程的复杂性，只是把它转移了——从"写代码"转移到了"对齐需求、控制质量、维护架构"。如果你不做任何改变，AI 加速的不是你的产出，而是你的技术债务。

这套 skills 的设计初衷，就是把《程序员修炼之道》和《软件设计哲学》里沉淀了几十年的原则，压缩成 agent 能直接执行的工作流。

---

## 一、四个失败模式：AI 编程的真正瓶颈

Matt 在 README 里开宗明义地列出了四个失败模式。理解它们是使用这套 skills 的前提，因为**每个 skill 都是针对特定失败模式的解药**。

```mermaid
flowchart LR
    subgraph Problems["AI 编程的四个失败模式"]
        P1["🎯 不对齐<br/>Agent 做了你想不到的"]
        P2["🗣️ 太啰嗦<br/>20 个词说 1 个词的事"]
        P3["💥 跑不通<br/>没有反馈循环，盲飞"]
        P4["🧱 泥球<br/>加速写代码 = 加速熵增"]
    end

    subgraph Skills["对应 Skills"]
        S1["/grill-me<br/>/grill-with-docs"]
        S2["CONTEXT.md<br/>共享语言"]
        S3["/tdd<br/>/diagnose"]
        S4["/improve-arch<br/>/to-prd /zoom-out"]
    end

    P1 --> S1
    P2 --> S2
    P3 --> S3
    P4 --> S4
```

### 1. 不对齐（The Agent Didn't Do What I Want）

> "No-one knows exactly what they want"
> —— David Thomas & Andrew Hunt, 《程序员修炼之道》

这是软件工程最古老的问题，AI 时代没有自动消失。你对着 agent 描述需求，它点头称是，写完一看——完全不是你想要的。

**解法不是把 prompt 写得更长，而是先做一场 grilling session。** `/grill-me` 和 `/grill-with-docs` 的作用，就是逼 agent 在写第一行代码之前，把每个决策分支都问清楚。

### 2. 太啰嗦（The Agent Is Way Too Verbose）

Agent 被丢进项目时，它不懂你的业务术语。它不知道你管这叫 "materialization cascade"，于是每次都要说"当课程里的一个 lesson 在 section 中被赋予文件系统位置时的问题"。20 个词，本来 1 个词就能搞定。

**解法是建立共享语言。** `/grill-with-docs` 会边 grilling 边维护 `CONTEXT.md`——一个项目术语表。一旦定义清楚，agent 和你用同一套语言说话，token 消耗下降，命名一致性上升。

### 3. 跑不通（The Code Doesn't Work）

Agent 没有眼睛。它看不到浏览器报错，跑不了测试，给不了反馈。它生成代码，然后"希望它能跑"。

**解法是给它反馈循环。** `/tdd` 强制 red-green-refactor 循环，`/diagnose` 把 debug 变成结构化流程。Agent 不再盲飞，而是有明确的 pass/fail 信号指引每一步。

### 4. 泥球（We Built A Ball Of Mud）

AI 写代码的速度是人类的几倍，于是代码腐烂的速度也是几倍。三个月后，你面对的是一个 agent 也改不动的泥球。

**解法是持续投资设计。** `/improve-codebase-architecture` 每几天跑一次，像请了一个常驻架构师。`/to-prd` 在动手前先问你会碰哪些模块，`/zoom-out` 逼 agent 从系统视角解释代码。

---

## 二、30 秒安装：从仓库到可用

```bash
npx skills@latest add mattpocock/skills
```

安装器会问你三件事：

1. **Issue tracker** —— GitHub Issues / GitLab / 本地 markdown（`.scratch/`）
2. **Triage label** 命名 —— 默认是 `needs-triage`、`ready-for-agent` 等，可映射到你现有标签
3. **Domain docs 布局** —— 单上下文（一个 `CONTEXT.md`）还是多上下文（monorepo，用 `CONTEXT-MAP.md`）

安装完成后，运行 `/setup-matt-pocock-skills`，它会为你的仓库生成：

```
AGENTS.md（或 CLAUDE.md）
├── ## Agent skills
│   ├── Issue tracker
│   ├── Triage labels
│   └── Domain docs
docs/agents/
├── issue-tracker.md
├── triage-labels.md
└── domain.md
```

**这是基础设施，跑一遍就行。** 之后所有 engineering skills 都会读取这些配置，知道你的 issue 存在哪、标签怎么叫、上下文文档在哪。

---

## 三、技能全景图：不是菜单，是工具箱

整套 skills 分三类：**Engineering**（代码工作流）、**Productivity**（通用效率）、**Misc**（辅助工具）。

```mermaid
mindmap
  root((Matt Pocock Skills))
    Engineering
      对齐与规划
        /grill-with-docs
        /to-prd
        /to-issues
        /prototype
      编码与验证
        /tdd
        /diagnose
      架构与维护
        /improve-arch
        /zoom-out
        /triage
      基础设施
        /setup-matt-pocock-skills
    Productivity
      /grill-me
      /caveman
      /handoff
      /write-a-skill
    Misc
      /setup-pre-commit
      /git-guardrails
      /migrate-to-shoehorn
      /scaffold-exercises
```

注意一个关键设计：**这些 skill 是组合用的，不是单独用的。** 就像你不会只用锤子盖房子，你也不会只靠 `/tdd` 做工程。

---

## 四、核心工作流：从需求到交付的完整闭环

真正体现这套 skills 威力的，是把它们串成一个工作流。以下是我日常使用最频繁的闭环：

```mermaid
sequenceDiagram
    actor U as You
    participant G as /grill-with-docs
    participant C as CONTEXT.md
    participant P as /prototype
    participant PRD as /to-prd
    participant I as /to-issues
    participant T as /tdd
    participant D as /diagnose
    participant A as /improve-arch

    U->>G: "我想做 X"
    G->>U:  grilling（逐个决策分支确认）
    G->>C: 更新术语表 + ADR
    U->>P: 需要验证方案可行性？
    P-->>U: 可运行原型 / 多版 UI 对比
    U->>PRD: 方案确定，生成 PRD
    PRD->>I: 拆成垂直切片的 issues
    loop 每个切片
        U->>T: red → green → refactor
        T-->>U: 行为级测试通过
    end
    opt 遇到 bug
        U->>D: reproduce → minimise → fix
        D-->>U: 回归测试通过
    end
    U->>A: 代码审阅 + 架构深化建议
    A-->>U: HTML 报告 + 可执行重构项
```

### 阶段 1：对齐 —— `/grill-with-docs`

这是整个工作流里最重要的一步，也是大多数人跳过的那步。

当你说"我想加个搜索功能"，agent 直接开写是灾难。`/grill-with-docs` 会把它变成一场结构化面试：

- Agent 先复述它理解的需求，标出所有假设
- 逐个决策分支提问（每次最多 3 个关键问题）
- 遇到模糊术语，立刻要求精确定义
- 精确定义的术语实时写入 `CONTEXT.md`
- 重大且不可逆的决策，提议写入 `docs/adr/`

**示例对话片段：**

> **你**："用户搜索需要支持拼音和模糊匹配。"
>
> **Agent**："你用了'用户'这个词。在 CONTEXT.md 里，'用户'对应的是 `Customer`（下单的人）还是 `User`（系统账号）？拼音匹配是指商品标题的拼音，还是用户输入的拼音？"
>
> **你**："是 `Customer` 搜索商品标题的拼音。"
>
> **Agent**："[实时写入 CONTEXT.md] `Customer`: 在本系统中指下单的终端消费者，区别于后台 `User`..."

这个环节的价值在第三、第四次对话时开始复利：agent 不再重复解释基本概念，代码命名自动对齐业务语言，新加入的 agent 读一遍 `CONTEXT.md` 就能跟上节奏。

### 阶段 2：验证 —— `/prototype`

如果方案涉及不确定的技术选型或交互设计，不要直接开写生产代码。`/prototype` 会做两件事之一：

- **终端原型**：一个可运行的 CLI 程序，验证状态机或业务逻辑
- **UI 变体**：在同一个路由下挂载多个完全不同的 UI 方案，你可以 toggle 对比

**关键原则：原型是 throwaway 的。** 验证完就扔，不心疼。

### 阶段 3：规划 —— `/to-prd` + `/to-issues`

对齐完成、方案验证后，用 `/to-prd` 把对话上下文合成为一份 PRD。它不会重新采访你，而是基于已经讨论过的内容生成：

- Problem Statement
- Solution
- 大量细化的 User Stories
- Implementation Decisions（模块边界、接口设计）
- Testing Decisions
- Out of Scope

PRD 生成后直接发布到 issue tracker（GitHub Issues 或本地 markdown），并打上 `ready-for-agent` 标签。

然后用 `/to-issues` 把 PRD 拆成**垂直切片**（tracer-bullet vertical slices）——每个 issue 都是一个可独立交付、可独立测试的端到端功能片段。

### 阶段 4：实现 —— `/tdd`

这是整套 skills 里 engineering 味最浓的一个。

**核心纪律：垂直切片，不是水平切片。**

```
❌ 水平切片（错误）：
   RED:   写完全部测试
   GREEN: 写完全部实现
   REFACTOR: 一起重构

✅ 垂直切片（正确）：
   RED→GREEN→REFACTOR: 测试 1 + 实现 1
   RED→GREEN→REFACTOR: 测试 2 + 实现 2
   RED→GREEN→REFACTOR: 测试 3 + 实现 3
```

`/tdd` 要求 agent：

1. **先确认接口** —— public API 长什么样，行为是什么
2. **写一个测试** —— 只测试一个行为，通过 public interface
3. **写最小实现** —— 刚好让测试通过
4. **重构** —— 提取 deep module，消除重复

**什么是 deep module？** 小接口，大实现。调用者知道得少，模块内部处理得多。这是 John Ousterhout 在《A Philosophy of Software Design》里的核心概念，被 `/tdd` 和 `/improve-codebase-architecture` 反复强化。

### 阶段 5：排障 —— `/diagnose`

遇到 hard bug 时，不要随机改代码碰运气。`/diagnose` 强制执行六阶段循环：

| 阶段 | 核心动作 | 纪律 |
|------|---------|------|
| 1. 建立反馈环 | 构造可自动运行的 repro | 没有 loop 就不进入下一阶段 |
| 2. 复现 | 确认 loop 输出的是用户描述的问题 | 不是"类似"的问题 |
| 3. 假设 | 生成 3-5 个可证伪的假设 | 不能陈述预测的假设 = vibe |
| 4. 仪器 | 一次只改一个变量 | 优先 debugger，拒绝"log everything" |
| 5. 修复 + 回归测试 | 先写回归测试，再修 | 没有 correct seam 是架构发现 |
| 6. 清理 + 复盘 | 删除所有 `[DEBUG-...]` 标记 | 追问：什么能预防这个 bug？ |

最被低估的是 Phase 1：**构造反馈环**。`/diagnose` 列出了 10 种构造 loop 的方式，从 failing test 到 HITL bash script。有了 2 秒内给出 pass/fail 的确定性 loop，bug 已经解决了 90%。

### 阶段 6：维护 —— `/improve-codebase-architecture`

建议每两三天在活跃项目上运行一次。它会：

1. 读取 `CONTEXT.md` 和 `docs/adr/`
2. 用 Explore agent 遍历代码库
3. 寻找**浅模块**（interface 和 implementation 复杂度接近）
4. 生成一份带 Before/After 图表的 HTML 报告
5. 对每个候选重构给出 `Strong` / `Worth exploring` / `Speculative` 评级

**关键概念：deletion test。** 想象删掉这个模块，复杂度是消失了（说明它是 pass-through），还是分散到了 N 个调用方（说明它确实在承担职责）？后者才是 deep module。

---

## 五、三个高价值使用场景

### 场景 A：从零开始一个新功能（完整闭环）

```
你：/grill-with-docs
     "我要加一个订单导出功能，支持 CSV 和 Excel，
      数据量可能到 50 万行，不能卡死前端。"

→ agent grilling，确认：
  - "导出"是异步还是同步？→ 异步
  - "不卡死前端"具体指标？→ 点击后 100ms 内响应，后台生成
  - 文件存储？→ 临时 S3，24h 过期
  - CSV/Excel 库已有？→ 无，需要引入

→ 术语写入 CONTEXT.md：
  **ExportJob**: 异步生成订单导出文件的后台任务
  _Avoid_: batch download, export task

→ /prototype（验证 Excel 生成性能）
→ /to-prd（生成 PRD，发布到 GitHub Issues）
→ /to-issues（拆成 4 个垂直切片）
→ /tdd（逐个切片 red-green-refactor）
→ /improve-codebase-architecture（周五下午跑一遍）
```

### 场景 B：接手 legacy 代码改 bug

```
你：/diagnose
     "这个接口偶发 500，大约 1% 概率，
      错误是 KeyError: 'user_id'，
      只在生产环境出现，本地复现不了。"

→ Phase 1：构造反馈环
  - 捕获生产环境的 HAR / 日志
  - 写一个 replay harness，用真实 payload 跑隔离代码
  - 把 1% 的 flake 提升到 50%（加并发、减延迟）

→ Phase 3：3 个假设
  1. Nginx 头转换偶尔失败 → 预测：直接访问会 100% 复现
  2. 上游服务偶尔不传头 → 预测：日志里会有特定 trace
  3. 大小写敏感问题 → 预测：小写头有时不存在

→ Phase 5：修复 + 回归测试
  - 先写测试：mock 无头请求 → 应 401
  - 修复：兼容 user_id / X-User-Id / 缺失
  - 跑回归 loop，确认 1% 不再出现

→ /improve-codebase-architecture
  - 发现：auth 中间件没有统一 seam
  - 建议：提取 AuthAdapter，已有 2 处调用 → 值得做
```

### 场景 C：长对话交接（/handoff + /caveman）

当你和一个 agent 聊了 50 轮，上下文快满了，或者需要换模型：

```
你：/handoff

→ agent 把当前会话压缩成一份 handoff 文档：
   - 已完成什么
   - 当前阻塞点
   - 下一步推荐动作
   - 相关文件和决策记录

→ 新开会话，把 handoff 文档丢给新 agent，
   它能在 30 秒内接上进度。

→ 如果 token 紧张：/caveman
   → agent 进入超压缩模式，砍掉 75% 的填充词，
     只保留技术实体。
```

---

## 六、隐藏杀手：CONTEXT.md 的飞轮效应

很多人把 mattpocock/skills 当成功能清单来用，却忽略了它最深的设计——**共享语言**。

```mermaid
flowchart TD
    A["开始项目<br/>术语混乱"] --> B["使用 /grill-with-docs<br/>逐个定义术语"]
    B --> C["写入 CONTEXT.md<br/>建立术语表"]
    C --> D["Agent 使用统一术语<br/>代码命名一致"]
    D --> E["代码更易导航<br/>Agent 更快理解"]
    E --> F["新 Agent 读 CONTEXT.md<br/>30 秒上手"]
    F --> G["更多术语被精确定义<br/>CONTEXT.md 增厚"]
    G --> C

    style C fill:#2563eb,color:#fff
    style D fill:#2563eb,color:#fff
```

**CONTEXT.md 的规则：**

- 只包含项目**特有**的业务术语，不包含通用编程概念
- 每个术语：一句话定义 + `_Avoid_` 列表（禁用同义词）
- 要 opinionated：同一概念多个词时，选一个最好的，其他的列为 avoid

**ADR（Architecture Decision Record）的规则：**

只有当三个条件同时满足时才写：

1. **难以逆转** —— 改主意成本很高
2. **没有上下文会令人困惑** —— 未来读者会问"为什么这样"
3. **真实权衡的结果** —— 有其他可行方案，你选了其中一个

这意味着 ADR 不是日记，不是文档，而是**防止未来重复讨论同一问题的 lock file**。

---

## 七、如何组合出你自己的工作流

Matt 的设计哲学是：**小、可组合、可 hack。** 你不需要用全部 skills，也不需要按固定顺序。但建议遵循以下原则：

| 原则 | 说明 |
|------|------|
| **Always grill first** | 任何超过 20 行代码的改动，先用 `/grill-me` 或 `/grill-with-docs` |
| **One vertical slice at a time** | 用 `/tdd` 时，拒绝"先写所有测试"的诱惑 |
| **Feedback loop before hypothesis** | 用 `/diagnose` 时，没有 repro 就不猜测 |
| **Invest in design every few days** | 活跃项目每 2-3 天跑一遍 `/improve-codebase-architecture` |
| **Context is code** | 把 `CONTEXT.md` 和 `docs/adr/` 当成代码一样维护，review 时过一遍 |

**最小可用工作流（如果你只想试一个）：**

```
1. /setup-matt-pocock-skills（一次）
2. /grill-with-docs（每次新功能）
3. /tdd（编码时）
```

这三步就能解决 80% 的"AI 写的东西没法用"问题。

---

## 八、总结

Matt Pocock 的 skills 之所以有价值，不是因为它让 AI 写得更快，而是因为它让 AI 写得更对。

| vibe coding | mattpocock/skills |
|-------------|-------------------|
| 说完需求就转身 | 先 grilling 对齐 |
| Agent 猜你的术语 | 共建 CONTEXT.md |
| 写完再测试 | red-green-refactor |
| 碰到 bug 随机改 | 结构化 diagnose |
| 代码自然腐烂 | 主动 improve architecture |
| 一次性的魔法 | 可复利的工程纪律 |

如果你已经在用 Claude Code、Codex 或其他 agent 做实际开发，花一个下午配置这套 skills，然后坚持用一个星期。最大的变化可能不是代码质量本身，而是你和 agent 之间的**对话质量**——从"你猜我要什么"变成"我们一起把问题想清楚"。

那才是 senior engineer 的工作方式，不管写代码的是人还是 AI。
