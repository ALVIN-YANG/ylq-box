---
title: "面试官追问 OpenClaw，Agent 忙着时怎样处理新消息"
description: "用一场模拟面试讲清 OpenClaw 的 steer、followup、collect、interrupt，重点解释新消息怎样进入当前运行或后续队列。"
date: 2026-08-13
lastUpdated: 2026-08-13
verifiedAgainst: "OpenClaw 2026.7.1-2 稳定版源码、随包文档与当前官方文档，2026-08-13"
sidebar:
  order: 8
---

下面是一场模拟面试，对话没有真实人物。题目始终围绕同一个场景。Agent 正在执行任务，用户又发来一条消息，系统该怎样处理。

先记住四句话就够了。

| 模式 | 新消息会去哪里 |
| --- | --- |
| `steer` | 送进当前这次运行，改变它后面的判断 |
| `followup` | 等当前运行结束，再单独跑一轮 |
| `collect` | 把连续几条消息合在一起，稍后只跑一轮 |
| `interrupt` | 要求当前运行停下，再执行最新消息 |

## 先别背四个名词

> **面试官**
>
> Agent 正在检查一个项目。工具还没跑完，用户又发来一句话。你会怎么处理？

> **候选人**
>
> 要看用户这句话想做什么。补充当前任务，用 `steer`。另起一件事，用 `followup`。连续补了几段材料，用 `collect`。发现方向错了，想让当前任务停下，用 `interrupt`。

> **面试官**
>
> 这是背文档。先讲消息进来以后，系统做的第一件事。

> **候选人**
>
> OpenClaw 先找到消息所属的 session，也就是这段会话。一个 session 同时只允许一个 run 执行。run 可以理解成 Agent 处理一条请求的完整过程，从读取上下文、调用模型和工具，一直到回复用户。
>
> 同一个 session 如果同时跑两个 run，两边都可能追加对话记录，也可能同时调用工具。工具请求和工具结果一旦交叉，后面的模型就很难知道哪个结果属于哪个请求。OpenClaw 因此先把同一 session 的 run 串行化。

```ts
if (session.hasActiveRun) {
  handleWithQueueMode(message)
} else {
  startNewRun(message)
}
```

> 四种模式处理的，正是 `hasActiveRun` 成立时的这条新消息。它们不会让两个 run 在同一 session 里并行抢状态。

## steer 怎样改变正在运行的 Agent

> **面试官**
>
> Agent 正在读项目文件。用户补了一句「只读检查，别改文件」。`steer` 怎么做？

> **候选人**
>
> 当前运行时支持 steering 时，新消息会交给当前 run。正在执行的工具不会被强行掐断。工具结束后，运行时找到一个可以安全插入用户消息的位置，再让模型带着新要求继续判断。

```text
模型要求读文件 -> 工具执行中 -> 安全边界 -> 模型再次判断
                     ↑             ↑
                 新消息到达     新消息写入上下文
```

> **面试官**
>
> 收到消息时直接塞进上下文，不行吗？

> **候选人**
>
> 不行。模型发出 tool call 以后，记录里必须出现对应的 tool result。用户消息如果插在两者中间，对话结构就会被打断。
>
> OpenClaw 当前的滚动文档写得更细。串行执行工具时，已经开始的调用会完成，后面尚未开始的调用可以跳过，并补上一条合成的错误结果。接着写入用户的新消息，再调用模型。这样每个 tool call 仍有结果，模型也能在启动下一个工具前看到修正。

> **面试官**
>
> 所以 `steer` 等于立即停止？

> **候选人**
>
> 不等于。它改变当前 run 后面还没做的部分，已经开始的工具通常会继续完成。OpenClaw 稳定版 `2026.7.1-2` 的随包文档把注入点写在当前工具调用批次结束以后，滚动文档已经把检查推进到工具启动边界。两种描述共有一个保证，运行中的工具不会被 `steer` 回滚，新消息会在结构安全的位置进入下一次模型判断。

> **面试官**
>
> 当前运行时不支持 steering 呢？

> **候选人**
>
> OpenClaw 会等当前 run 结束，再把这条消息作为新一轮请求执行。

## followup 为什么会多跑一轮

> **面试官**
>
> Agent 还在检查项目，用户说「检查完以后，再生成一份测试报告」。这句话没必要改变当前任务，怎么处理？

> **候选人**
>
> 用 `followup`。OpenClaw 把消息放进这个 session 的等待队列。当前 run 结束后，队列按到达顺序取消息，每条消息各开一个新 run。

```text
当前 run 完成 -> 消息一开一个 run -> 消息二再开一个 run
```

> **面试官**
>
> 用户忙碌期间连发两条，模型会看到几轮？

> **候选人**
>
> 两轮。第一条处理完，第二条才开始。每条消息都有独立回答，代价是要做两次上下文组装和模型调用，第二条也会等得更久。

## collect 怎样把碎片合成一次请求

> **面试官**
>
> 用户习惯把一句话拆成三条发。
>
> 「查一下登录问题」
>
> 「旧 session 也要查」
>
> 「只看日志，先别改」
>
> 如果用 `followup`，Agent 会跑三轮。你会怎么改？

> **候选人**
>
> 用 `collect`。消息先进入等待队列。当前 run 结束后，OpenClaw 还会等一个安静窗口。默认 500 毫秒内没有新消息，兼容的几条消息就按到达顺序合成一个 prompt，只开一个新 run。

```text
消息一 + 消息二 + 消息三 -> 等待 500ms -> 合成一个 prompt -> 一个 run
```

> **面试官**
>
> 什么叫兼容？不同群聊里的消息也能合吗？

> **候选人**
>
> 不能随便合。OpenClaw 会比较 channel、thread、接收目标、账号和回复位置。投递目标不同的消息要分开处理，否则 A 线程的问题可能回到 B 线程。

> **面试官**
>
> 它和 `followup` 的实现差别只在合并吗？

> **候选人**
>
> 核心差别就在 drain，也就是从队列取消息的过程。`followup` 一次取一条，一条开一个 run。`collect` 等安静窗口结束，再把同路由的多条消息合成一个 run。

## interrupt 能不能撤回已经发生的动作

> **面试官**
>
> Agent 正在修改代码，用户突然说「停，项目选错了」。这时还用 `steer` 吗？

> **候选人**
>
> 这时用 `interrupt`。OpenClaw 向当前 run 发出 abort，也就是取消信号，并清掉这个 session 里尚未开始的工作。当前 run 退出以后，最新消息再获得执行机会。

```text
当前 run -> 收到取消信号 -> 退出
最新消息                  -> 开始新的 run
```

> **面试官**
>
> 已经改过的文件会自动恢复吗？

> **候选人**
>
> 不会。取消信号只能要求正在运行的代码停下来。已经写入的文件和已经发出的消息都可能留下来，数据库事务一旦提交也不会自动撤销。工具需要自己支持幂等、取消检查或补偿操作，OpenClaw 无法替任意工具做通用回滚。

## 面试官最后让你选模式

> **面试官**
>
> 不许解释，每个场景只给一个答案。

| 用户的真实意图 | 选择 |
| --- | --- |
| 当前任务方向没错，只想补条件 | `steer` |
| 当前任务做完以后，每条消息都要单独回答 | `followup` |
| 用户连续发来同一件事的几段补充 | `collect` |
| 当前任务已经错了，继续执行可能有风险 | `interrupt` |

## 两个容易漏掉的实现细节

> **面试官**
>
> 队列一直堆会怎样？

> **候选人**
>
> 默认最多保留 20 条。超过以后由 `drop` 决定丢最新消息、丢最早消息，或采用默认的 `summarize`。稳定版源码里的 `summarize` 不会再调用一次模型，它只把被移除消息压成受长度限制的文本预览，稍后交给 Agent。

> **面试官**
>
> Gateway 重启以后，排队消息还在吗？

> **候选人**
>
> 不应依赖它继续存在。稳定版的 followup 队列保存在进程内的 Map 里，没有外部任务存储。必须跨重启处理的业务消息，还要在渠道接入层或业务层持久化。

会话内可以这样切换模式。

```text
/queue steer
/queue followup
/queue collect debounce:0.5s cap:25 drop:summarize
/queue interrupt
/queue reset
```

`steer` 是默认模式。默认参数还包括 500 毫秒的等待窗口、20 条队列上限和 `drop:summarize`。会话内的 `/queue` 设置优先于渠道设置，渠道设置又优先于全局设置。

## 参考资料

- [OpenClaw 命令队列文档](https://docs.openclaw.ai/concepts/queue)
- [OpenClaw Steering 队列文档](https://docs.openclaw.ai/concepts/queue-steering)
- [OpenClaw Agent loop 文档](https://docs.openclaw.ai/concepts/agent-loop)
- [OpenClaw 2026.7.1-2 队列 drain 源码](https://github.com/openclaw/openclaw/blob/v2026.7.1-2/src/auto-reply/reply/queue/drain.ts)
- [OpenClaw 2026.7.1-2 入队源码](https://github.com/openclaw/openclaw/blob/v2026.7.1-2/src/auto-reply/reply/queue/enqueue.ts)
- [OpenClaw 2026.7.1-2 session lane 源码](https://github.com/openclaw/openclaw/blob/v2026.7.1-2/src/process/command-queue.ts)
- [OpenClaw 2026.7.1-2 发布记录](https://github.com/openclaw/openclaw/releases/tag/v2026.7.1-2)
