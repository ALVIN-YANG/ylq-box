---
title: OpenClaw 插件全解析：从 Tool、Hook 到 Slot
description: 基于 OpenClaw 官方文档，系统拆解插件的能力边界、生命周期钩子、插槽机制、配置方式与开发范式
---

很多人刚接触 OpenClaw 插件时，容易把它理解成“更高级一点的 Tool”。这个理解不算错，但远远不够。

如果你只是想给 Agent 增加一个函数，`Tool` 已经够用；如果你只是想补充一些领域知识，`Skill` 也更轻。但当你的需求开始触碰下面这些问题时，插件才是真正的扩展边界：

- 想在 Prompt 构建前自动注入上下文
- 想在模型解析前决定模型路由
- 想在工具调用前做统一拦截或审计
- 想注册后台服务、HTTP 路由、Gateway RPC
- 想替换 OpenClaw 的默认记忆系统或上下文引擎

一句话：**Tool 解决“让 Agent 多一个能力”，Plugin 解决“让 OpenClaw 多一层机制”。**

这篇文章不写某个具体业务插件，也不做产品宣传，只回答一个更底层的问题：

> OpenClaw 插件到底是什么，它和 Tool、Skill、Hook 分别是什么关系，什么时候该用，什么时候不该用？

---

## 一、先把边界说清楚：Skill、Tool、Plugin 分别解决什么问题

在 OpenClaw 里，很多扩展诉求都能“看起来”用多种方式实现，但它们的作用点完全不同。

| 机制 | 本质 | 谁触发 | 适合什么 |
|------|------|--------|---------|
| `Skill` | 注入给模型的说明与知识 | 系统在构建上下文时加载 | 行为约束、风格指导、知识补充 |
| `Tool` | 一个可被模型调用的函数 | 模型自己决定是否调用 | 搜索、计算、文件处理、外部 API 调用 |
| `Plugin` | 运行在 Gateway 进程内的扩展模块 | OpenClaw 运行时加载 | 生命周期干预、能力注册、核心机制扩展 |

真正关键的差别不在“功能多少”，而在**控制点**。

- `Skill` 控制的是模型“怎么想”
- `Tool` 控制的是模型“能做什么”
- `Plugin` 控制的是 OpenClaw “在什么时候做什么”

这就是为什么插件不是 Tool 的超集，而是**另一个层级的扩展机制**。

### 什么时候 Tool 不够了

一个典型信号是：你不再满足于“等模型决定要不要调用”。

例如下面这些需求：

- 每次对话开始前都自动补一段上下文
- 每次工具调用前都统一做权限校验
- 每次 Agent 结束后都记录审计日志
- 想让某个能力在 Gateway 启动时初始化，而不是等对话触发

这类需求的共同点是：**动作必须发生，而不是交给模型自由判断。**

一旦走到这里，Tool 就不是最佳抽象了，Plugin 才是。

---

## 二、插件到底是什么

按照 OpenClaw 官方文档，插件本质上是**运行时加载的 TypeScript 模块**。它们通过 `jiti` 动态加载，和 Gateway 运行在同一个进程里。

这件事有两个直接后果：

1. 插件能力很强，可以注册很多核心扩展点
2. 插件也必须被当成**受信任代码**来对待

官方文档明确提到，插件可以注册这些能力：

- Auto-reply commands
- Skills 目录
- Background services
- CLI commands
- Agent tools
- Gateway HTTP routes
- Gateway RPC methods
- Context engines
- Provider auth flows
- Messaging channels

这意味着插件不是“某个单点功能”，而是 OpenClaw 的**正式扩展面**。

### 一个插件最小长什么样

插件根目录至少需要有一个 `openclaw.plugin.json`：

```text
my-plugin/
├── openclaw.plugin.json
├── package.json
└── index.ts
```

其中：

- `openclaw.plugin.json` 负责声明插件身份和配置 Schema
- `package.json` 里的 `openclaw.extensions` 负责声明入口
- `index.ts` 负责真正注册工具、钩子、服务等能力

一个极简的 manifest 可以长这样：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": { "type": "string" }
    }
  }
}
```

而 `package.json` 里要告诉 OpenClaw 从哪里加载：

```json
{
  "name": "my-plugin",
  "openclaw": {
    "extensions": ["./index.ts"]
  }
}
```

这里有一个很好的设计点：**配置校验不需要执行插件代码**，它基于 manifest 和 JSON Schema 完成。这让插件配置检查比很多动态系统都更可控。

### 不要忽略 `package pack`

官方文档里还有一个很实用但容易被忽略的点：一个插件目录不一定只能导出一个插件。

如果 `package.json` 里写的是：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"]
  }
}
```

那么这会变成一个 **plugin pack**。也就是说，一个 npm 包里可以承载多个扩展入口，而不是强制“一包一个插件”。

这很适合做两类事情：

- 把同一主题下的多个插件放在一个仓库里统一维护
- 把“工具插件”“安全插件”“路由插件”拆成多个入口，避免一个入口越来越肿

### 插件 ID 不是小事

OpenClaw 会基于文件名、包名或导出的 `id` 来解析插件身份。如果多个插件最终解析到同一个 `id`，高优先级的那个会生效，低优先级副本会被忽略。

这件事看起来只是命名问题，实际上影响三件事：

- `plugins.entries` 配置到底落到谁身上
- `plugins.allow / deny` 到底管的是谁
- 出现冲突时你能不能快速定位

写插件时，一个简单但有效的习惯是：**从第一天就把插件 ID 视为稳定接口，而不是临时命名。**

---

## 三、插件和 Hook 的关系：不要混为一谈

很多文章会把 Plugin 和 Hook 混着讲，但这两者不是一回事。

### 1. Hook 是事件机制

OpenClaw 官方文档里，`Hooks` 是一套事件驱动系统，用来在命令或生命周期事件发生时执行脚本。它们可以是：

- 外部触发的 `Webhooks`
- 运行在 Gateway 内部的 `Hooks`

官方还支持三类 Hook 来源：

1. Bundled hooks
2. `~/.openclaw/hooks/`
3. 工作区 `hooks/`

也就是说，**Hook 本身是一套独立机制**。

### 2. Plugin 可以注册 Hook

但插件也可以把 Hook 能力打包进去。官方文档给了两种插件侧扩展方式：

- `api.registerHook(...)`
- `api.on(...)`

其中 `api.on(...)` 主要用于类型化的 Agent 生命周期钩子，例如：

- `before_model_resolve`
- `before_prompt_build`
- `before_agent_start`（兼容性 legacy hook）

所以更准确的说法是：

> Hook 是事件系统，Plugin 是扩展容器；Plugin 可以注册 Hook，但 Plugin 不等于 Hook。

这个边界一定要分清，不然后面在设计插件时很容易把“生命周期逻辑”和“能力注册逻辑”混成一锅。

### Hook 更像“局部事件自动化”，Plugin 更像“扩展宿主”

这两个机制都能响应事件，但定位不同：

- Hook 更像“某个事件发生时跑一段脚本”
- Plugin 更像“往 OpenClaw 宿主里注册一批能力”

如果你的诉求是：

- 针对 `/new`、`/reset` 之类命令做自动化
- 写一些工作区级的小脚本
- 快速试一个事件响应逻辑

Hook 往往更轻。

如果你的诉求是：

- 需要配置 Schema
- 需要注册 Tool / Service / Route / Channel
- 需要多个能力协同工作
- 需要通过包形式分发

那就应该直接走 Plugin。

---

## 四、最值得关注的插件能力：生命周期干预

插件真正有技术含量的地方，不是 `registerTool()`，而是**对生命周期的介入能力**。

官方文档里几个最关键的点是：

### 1. `before_model_resolve`

这个钩子发生在 session load 之前，消息还不可用。  
它的用途很明确：**在模型解析前做确定性的模型/Provider 覆盖**。

如果你的需求是：

- 某类 Agent 固定走某模型
- 某类任务按规则切换 Provider
- 希望模型选择不依赖 Prompt 注入

这个钩子比 `before_agent_start` 更准确。

### 2. `before_prompt_build`

这是插件最值得用的生命周期点之一。

官方文档给出的能力包括：

- `prependSystemContext`
- `appendSystemContext`
- `systemPrompt`
- `prependContext`

也就是说，你可以在 Prompt 真正成型前，决定：

- 系统提示前后追加什么
- 是否整体覆盖系统提示
- 是否给当前用户输入前插一段动态上下文

这类能力，是 Tool 和 Skill 都做不到的。

官方文档还有两个很重要的细节：

1. 这个钩子发生在 session load 之后，`messages` 已经可用
2. 它支持按优先级执行，且高优先级先运行

这意味着它非常适合做：

- 基于当前消息内容的动态上下文注入
- 有顺序要求的 Prompt 拼接
- 按插件职责拆分的提示词增强

### 3. Prompt 注入不是默认无限开放

OpenClaw 官方文档还提到一个很关键的控制项：

```json5
plugins.entries.<plugin-id>.hooks.allowPromptInjection: false
```

也就是说，运维侧是可以对插件的 prompt 注入能力做限制的。

这背后的设计思路很对：  
**Prompt 构建是高权限扩展点，不应该被当成“普通字符串拼接”来放任使用。**

### 3. `before_agent_start`

官方明确把它标成了 **legacy compatibility hook**。  
如果是新插件，优先考虑：

- 用 `before_model_resolve` 做模型选择
- 用 `before_prompt_build` 做 Prompt 注入

这也是写插件时很重要的一个判断：**能用新语义钩子就不要堆兼容钩子。**

### 一个值得记住的顺序

结合官方文档，和 Prompt 最相关的顺序可以简单记成：

```text
before_model_resolve
  → session load
  → before_prompt_build
  → legacy before_agent_start fallback
  → 真正发起模型调用
```

这个顺序很重要，因为它决定了：

- 哪些逻辑能看到 `messages`
- 哪些逻辑能稳定覆盖模型
- 哪些 prompt 片段会覆盖或追加到谁前面

如果你把这条顺序搞混，插件的行为就会变得非常难解释。

---

## 五、从“能扩展”到“能替换”：Slot Plugin 才是插件体系最狠的一刀

如果说普通插件是在 OpenClaw 旁边加能力，那 `Slot Plugin` 做的是另一件事：**替换 OpenClaw 核心能力。**

官方文档里明确给了 `plugins.slots`：

```json5
{
  "plugins": {
    "slots": {
      "memory": "memory-core",
      "contextEngine": "legacy"
    }
  }
}
```

目前最关键的两个插槽是：

- `memory`
- `contextEngine`

### 1. `memory`

这是长期记忆插件插槽。

官方文档里提到：

- `memory-core` 是默认内置实现
- 也可以切换到其他 memory plugin
- 设置成 `"none"` 可以直接禁用 memory plugin

这意味着记忆系统在 OpenClaw 里不是写死的，而是**可替换组件**。

### 2. `contextEngine`

这个插槽更值得技术人关注，因为它触碰的是上下文编排本身。

官方描述里，context engine 负责：

- session context orchestration
- ingest
- assembly
- compaction

也就是说，**如果你不只是想加一点上下文，而是想接管上下文管线本身，就得走 context engine plugin。**

这是插件体系和普通工具体系最大的层级差异之一。

---

## 六、插件开发时，最实用的 API 只有几类

OpenClaw 插件表面能力很多，但真正常用的其实就这么几组。

### 1. 注册工具：`api.registerTool(...)`

这是最容易理解的一层。插件可以注册 Agent 工具，把函数暴露给模型调用。

如果你写的是“会被模型主动调用的能力”，大概率从这里起步。

但要记住：  
**写成插件里的 Tool，不代表你的设计就是插件化设计。**  
如果你只注册工具，不用生命周期、不用服务、不用插槽，本质上你只是把 Tool 放进了插件包里。

### 2. 注册生命周期钩子：`api.on(...)`

这是插件和普通 Tool 分层的关键 API。

一旦你开始用：

- `before_prompt_build`
- `before_model_resolve`

你就不再只是“给模型加功能”，而是在干预 OpenClaw 的运行过程。

### 3. 注册服务：`api.registerService(...)`

这个 API 很重要，因为它让插件拥有了**资源生命周期**。

比如：

- 启动时初始化连接池
- 关闭时释放资源
- 启动后台 watcher
- 持有长生命周期状态

写到这里，插件就已经不是“一个函数集合”，而更像一个真正的运行时组件。

### 4. 注册 HTTP Route：`api.registerHttpRoute(...)`

官方文档明确推荐用这个 API，而不是旧的 `registerHttpHandler(...)`。

它适合做：

- webhook 接入
- 插件私有接口
- 对外回调入口

而且文档里还提到了显式 `auth`、路由冲突、替换已有路由等约束，说明这不是“随便挂个 endpoint”，而是 OpenClaw 在认真把插件当一等扩展面。

### 5. 还有两类能力值得知道

虽然这篇不展开讲，但官方文档里插件还能注册两类很重的扩展：

- `api.registerProvider(...)`：模型 Provider 的认证与登录流
- `api.registerChannel(...)`：消息渠道插件

这说明 OpenClaw 插件体系不是只服务 Agent 工具，而是把“模型接入层”和“消息接入层”也一起纳入了统一扩展面。

从体系设计上看，这比“工具插件系统”要完整得多。

---

## 七、一个最小可用插件到底长什么样

前面讲的是概念，下面给一个更贴近实际的最小例子。

```ts
import { Type } from "@sinclair/typebox";

export default function register(api) {
  api.registerTool(
    {
      name: "say_hello",
      label: "Say Hello",
      description: "Return a greeting",
      parameters: Type.Object({
        name: Type.String(),
      }),
      async execute(_toolCallId, params) {
        const { name } = params as { name: string };
        return {
          content: [{ type: "text", text: `Hello, ${name}!` }],
        };
      },
    },
    { name: "say_hello" },
  );

  api.on("before_prompt_build", async () => {
    return {
      prependSystemContext: "Be concise and technical.",
    };
  });

  api.registerService({
    id: "my-plugin-service",
    start: (ctx) => ctx.logger.info("plugin started"),
    stop: async (ctx) => ctx.logger.info("plugin stopped"),
  });
}
```

这个例子已经包含了插件开发里三种最常见的职责：

- 注册 Tool
- 注入生命周期逻辑
- 管理运行时资源

也正因为这三类职责经常同时出现，Plugin 才值得作为单独抽象存在。

---

## 八、插件发现、安装、配置：这些细节决定了它能不能真正进生产

很多插件文章喜欢把重点放在“怎么写注册函数”，但真正影响可维护性的，往往是加载与配置方式。

### 1. 插件发现

官方文档里有几条关键规则：

- 每个插件根目录必须有 `openclaw.plugin.json`
- `openclaw.extensions` 里的入口必须留在插件目录内部
- 如果多个插件解析到同一个 `id`，按优先级第一个生效

这几条规则看起来细碎，但本质上是在解决三件事：

- 身份确定性
- 路径安全
- 冲突可预期

官方文档里还特别强调了一点：如果发现的是非 bundled 插件，而 `plugins.allow` 为空，OpenClaw 会给出启动告警。

这其实是在提醒你一件很现实的事：

> 插件不是“随便装个扩展”，而是“把一段代码引进主进程”。

### 2. 配置结构

官方推荐的配置入口是：

```json5
{
  "plugins": {
    "enabled": true,
    "allow": ["voice-call"],
    "deny": ["untrusted-plugin"],
    "load": {
      "paths": ["~/Projects/oss/voice-call-extension"]
    },
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "twilio"
        }
      }
    }
  }
}
```

这里最值得注意的是：

- `entries`：每个插件自己的配置空间
- `allow / deny`：加载控制
- `load.paths`：开发期本地路径加载
- `slots`：独占型插件选择

对我来说，这套结构的优点很明显：**把“发现、启用、配置、替换”四件事拆开了。**

这比很多把插件配置揉成一团的系统更清楚。

### 3. 开发期和运行期是两套心态

开发期最方便的方式通常是：

- 用 `plugins.load.paths` 指到本地目录
- 频繁重启 Gateway 做验证

运行期更重要的则是：

- 用明确的包版本安装
- 配好 `allow / deny`
- 明确 `entries` 和 `slots`

不要把开发期“本地直连目录”的习惯直接带进长期运行环境。

---

## 九、什么时候你真的该写 Plugin

这是最重要的问题。不是“能不能写”，而是“值不值得写”。

我自己的判断标准很简单。

### 适合写 Plugin 的场景

- 你需要在生命周期某个固定阶段必然执行逻辑
- 你需要注册后台服务、路由或 RPC
- 你需要把多个能力封成一个可安装、可配置、可复用的扩展
- 你要替换 memory 或 context engine 这类核心能力
- 你要做一个真正意义上的 OpenClaw 扩展组件

### 不适合写 Plugin 的场景

- 只是补一段知识说明
- 只是新增一个简单函数
- 只是做一次性脚本
- 只是想验证某个想法

这时候优先顺序通常应该是：

```text
Skill → Tool → Plugin
```

不要一上来就写插件。  
插件不是“更高级的做法”，而是“更重的边界”。

---

## 十、我觉得最容易踩的五个坑

### 坑 1：把 Plugin 当 Tool 打包器

很多人写插件，最后只做了一件事：注册几个 Tool。

这当然没错，但如果插件里没有生命周期介入、服务管理、配置策略或扩展边界，本质上只是“把 Tool 装进 npm 包”。  
这不一定有问题，但要知道自己到底是在做什么。

### 坑 2：把 `before_agent_start` 当万能入口

官方已经很明确：

- `before_agent_start` 是 legacy compatibility hook
- 新逻辑更推荐拆到 `before_model_resolve` 和 `before_prompt_build`

如果你继续把所有前置逻辑都堆到一个兼容钩子里，后面一定会遇到边界不清和行为难解释的问题。

### 坑 3：忽略插件是受信任代码

官方文档里明确强调插件运行在 Gateway 进程内。  
这不是浏览器插件，也不是沙箱脚本，而是**进程内扩展**。

这意味着：

- 依赖树要克制
- 路径和来源要可控
- `allow / deny` 要真的用起来
- 外部插件要按“代码引入”而不是“配置项”去审视

插件体系越强，这条安全边界就越重要。

### 坑 4：把配置 Schema 当摆设

官方插件体系的一大优点，就是 `openclaw.plugin.json` 能承担配置校验职责。

如果你不认真写：

- `configSchema`
- `additionalProperties`
- 必填项
- 敏感字段的 UI hints

那你其实是在主动放弃插件体系里最有价值的“可验证性”。

### 坑 5：一上来就试图替换核心 Slot

`memory` 和 `contextEngine` 很强，但也最容易把问题做大。

如果你还没有把普通插件写顺，就直接去替换：

- 记忆系统
- 上下文编排管线

最后通常会遇到两类问题：

- 行为边界不清
- 排障难度陡增

Slot Plugin 适合在你已经清楚默认实现哪里不够，并且真的准备接管这条链路时再用。

---

## 十一、如果你真要开始写一个插件，我建议这样起步

比起一开始就做“大插件”，更稳的路径通常是：

1. 先确认需求是不是 `Skill` 或 `Tool` 就能解决
2. 如果必须稳定介入生命周期，再上 `Plugin`
3. 第一版只做一件事，例如：
   - 一个 `before_prompt_build`
   - 一个 `registerTool`
   - 一个 `registerService`
4. 等边界清楚后，再考虑：
   - Route
   - Provider
   - Channel
   - Slot Plugin

这个顺序的好处很简单：  
**先把扩展边界做对，再把扩展能力做大。**

---

## 十二、写在最后

OpenClaw 插件体系最值得肯定的地方，不是“能做很多事”，而是它把扩展面分得比较清楚：

- Tool 负责能力调用
- Hook 负责事件响应
- Plugin 负责扩展容器
- Slot 负责核心能力替换

这套设计最有价值的地方在于，它允许你按复杂度逐步升级，而不是一上来就把所有扩展都做成插件。

如果只用一句话总结：

> 当你的需求开始从“给 Agent 多一个函数”变成“让 OpenClaw 在某个阶段稳定发生某件事”，你就该开始考虑 Plugin 了。

而当你进一步走到要替换默认 memory 或 context pipeline 时，Plugin 就不再是“可选方案”，而是唯一正确的扩展边界。
