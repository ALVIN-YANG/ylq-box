---
title: "Agent 忙着时又来消息，OpenClaw 怎样接住新输入"
description: "从 session lane、运行时注入、后续队列和取消信号出发，讲清 steer、followup、collect、interrupt 四种输入处理方式的实现原理。"
date: 2026-08-13
lastUpdated: 2026-08-13
verifiedAgainst: "OpenClaw 2026.7.1-2 稳定版源码、随包文档与当前官方文档，2026-08-13"
sidebar:
  order: 8
---

Agent 处理一个长任务时，用户很可能继续发消息。有人补充条件，有人连发三段资料，也有人发现任务错了，要求马上停。新输入到达的那一刻，系统要决定它交给谁、什么时候生效、原来的工作还要不要继续。

我把 npm 的 `latest`、`v2026.7.1-2` 发布标签、随包文档和官网滚动文档对了一遍。截至 2026 年 8 月 13 日，npm 的稳定版仍是 `2026.7.1-2`，官网文档已经包含更新的 `steer` 调度细节。本文讲源码里长期成立的队列设计，也会单独标出这处版本差异。这是一篇源码解读，运行细节应以实际安装版本为准。

OpenClaw 给了四种队列模式。

| 模式 | 新输入怎样处理 | 当前运行怎样处理 | 常见用途 |
| --- | --- | --- | --- |
| `steer` | 注入当前运行 | 继续到可接收输入的运行时边界 | 补条件、改方向 |
| `followup` | 每条消息排成独立后续轮次 | 正常完成 | 每条都需要单独回答 |
| `collect` | 等安静窗口结束，合成一个后续轮次 | 正常完成 | 连续补充资料 |
| `interrupt` | 取消当前运行，执行最新消息 | 请求中止 | 任务已经错了或继续执行有风险 |

`steer` 是默认值。默认队列参数还有 `debounceMs` 为 500 毫秒、`cap` 为 20、`drop` 为 `summarize`。这些数值会影响消息何时合并、积压到多少以后开始丢弃。

## 四种模式共享同一条并发边界

OpenClaw 收到消息以后，会先解析它属于哪个 session。每个 session 有自己的执行 lane，`runEmbeddedAgent` 把同一 session 的运行串行化。同一时刻只有一个 run 能修改这段会话，其他 session 仍可在全局并发上限内同时工作。

这一层先解决状态冲突。两个 run 同时追加 transcript、同时调用工具、同时更新会话状态，很容易把调用和结果写乱。session lane 把并发挡在会话外面，四种 queue mode 再决定活动 run 面前的新消息走哪条路。

`collect` 不会让几个 run 并行工作，`interrupt` 也不会创建第二个 run 去争抢 session。它们都服从同一个串行边界。

## steer 把输入送进当前运行

假设 Agent 正在检查一个项目，用户补了一句“只读检查，别改文件”。`steer` 会尽量让当前 run 在下一次模型决策前看到这句话。模型随后可以调整剩余步骤，不必等整项任务结束后再开一轮。

注入点必须保护 transcript 的结构。模型发出 tool call 后，运行时要给每个调用配上 tool result。新用户消息如果插在两者中间，后续模型看到的历史就可能失去配对关系。OpenClaw 因此只在运行时允许的边界接收 steering。

这里存在一个明确的版本差异。`2026.7.1-2` 随包文档写的是，当前 assistant turn 的工具调用批次执行完，OpenClaw 再取出 steering 消息，在下一次 LLM 调用前追加为 user message。官网当前文档把边界推进到了工具启动阶段。

按官网当前描述，串行工具调用中已经开始的调用会跑完，尚未开始的尾部调用可以跳过，并写入成对的合成错误结果。并行批次在统一启动检查点处理。一批调用一旦越过检查点，运行时不会再把它们召回。两版实现共有的保证很清楚，已经开始的工具工作不会被 `steer` 强行回滚，新输入会在结构安全的边界进入下一次模型判断。

Codex app-server 走另一条适配路径。OpenClaw 会在安静窗口内收集输入，按到达顺序合成一次 `turn/steer`。具体工具调度由 Codex 自己负责。review 和手动 compaction 等不能接收同轮 steering 的运行，会等当前 run 完成，再把消息当普通 prompt 处理。

显式的 `/steer <message>` 也值得分开看。它不受当前 `/queue` 模式限制，会先尝试把内容交给活动 run。运行空闲或当前 runtime 无法接收时，命令前缀会被去掉，内容作为普通新一轮输入继续执行。

## followup 保留每条消息的轮次

`followup` 不碰活动 run。新消息会变成一个 `FollowupRun`，放进以 session 为 key 的内存队列。当前运行结束后，drain 过程按顺序取出消息，每条各开一个 Agent turn。

独立轮次保留了清楚的问答边界。用户在 Agent 忙碌期间先问部署结果，又追问错误日志，两条消息会依次得到回答。代价也很直接，两条消息会触发两次上下文组装和模型调用，后发消息还要等待前面的轮次完成。

源码还会用消息 ID 和路由信息去重，避免同一条渠道消息因为重试而重复入队。队列本身放在进程内的全局 Map 中，没有外部 worker 和持久化存储。Gateway 重启时不应把这类等待消息当成可靠任务继续执行。需要跨重启保证的业务输入，应在渠道接入层或业务层另存一份。

## collect 把连续补充合成一轮

很多聊天输入天然是分段的。用户先发任务，隔几十毫秒补一个链接，再补一句限制。`collect` 让这些消息先等当前 run 结束，并等待 `debounceMs` 定义的安静窗口。窗口内没有新消息以后，drain 过程才开始合并。

源码生成的 prompt 以 `[Queued messages while agent was busy]` 开头，每条输入带有 `Queued #1` 这样的顺序标记，有发送者信息时也会保留。模型收到的是一个后续 turn，因此只做一次上下文组装和模型调用。

合并有严格边界。OpenClaw 会比较 channel、接收目标、account、thread、回复锚点、授权上下文和运行策略。投递上下文不同的消息会拆开处理。跨频道消息和某些只在当前轮有效的运行时信息也会逐条执行，避免把 A 线程的内容回到 B 线程。

`collect` 适合连续补资料，也会改变交互语义。三条独立问题合成一次以后，模型可能给一份综合回答。每条消息都需要单独确认时，`followup` 更稳。

## interrupt 终止当前 run

`interrupt` 处理的是替换意图。源码会清理当前 session lane 里尚未开始的任务，并向活动 embedded run 发出 abort。随后，最新输入获得执行机会。

取消信号只能要求运行代码停下来。已经完成的外部动作仍然存在，例如已经发送的消息、已经提交的数据库事务、已经完成的付款请求。OpenClaw 没有办法为任意 Tool 提供通用回滚。带副作用的工具仍要做幂等、取消检查和补偿操作。

这也是 `steer` 和 `interrupt` 最实在的区别。补一条限制，希望 Agent 调整后续步骤，用 `steer`。发现任务目标错误，继续跑可能产生副作用，用 `interrupt`，随后检查已经发生了什么。

## 队列满了以后发生什么

默认 `cap` 是 20。队列达到上限以后，`drop` 决定保留哪一边。

`drop:new` 拒绝最新消息。`drop:old` 移除最早消息。默认的 `drop:summarize` 会移除最早消息，同时留下一个受长度限制的文本预览，后面以合成 followup prompt 的形式交给 Agent。

这里的 `summarize` 做法很朴素。稳定版源码会压平空白，把单条预览截到约 160 个字符，并限制保存的预览数量。这个步骤没有再调用一次 LLM。积压内容很重要时，仍然需要业务层确认消息是否被完整处理。

## 配置应该跟着输入习惯走

会话内可以直接切换模式。

```text
/queue steer
/queue followup
/queue collect debounce:0.5s cap:25 drop:summarize
/queue interrupt
/queue reset
```

也可以为渠道设不同默认值。

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: {
        discord: "collect"
      }
    }
  }
}
```

配置解析有固定优先级。会话内 `/queue` 覆盖渠道设置，渠道设置覆盖全局模式，全都没有时使用 `steer`。这套顺序让一个 Gateway 可以把私聊设成及时修正，把多人频道设成批量收集，同时允许某个 session 临时改变行为。

选模式时只需要看两件事。新消息要不要改变当前 run，消息之间要不要保留独立轮次。前一个问题区分 `steer`、`interrupt` 和延后处理，后一个问题区分 `followup` 与 `collect`。带副作用的任务还要多检查一步，取消以后哪些动作已经无法撤回。

## 参考资料

- [OpenClaw 命令队列文档](https://docs.openclaw.ai/concepts/queue)
- [OpenClaw Steering 队列文档](https://docs.openclaw.ai/concepts/queue-steering)
- [OpenClaw Agent loop 文档](https://docs.openclaw.ai/concepts/agent-loop)
- [OpenClaw 2026.7.1-2 队列 drain 源码](https://github.com/openclaw/openclaw/blob/v2026.7.1-2/src/auto-reply/reply/queue/drain.ts)
- [OpenClaw 2026.7.1-2 入队源码](https://github.com/openclaw/openclaw/blob/v2026.7.1-2/src/auto-reply/reply/queue/enqueue.ts)
- [OpenClaw 2026.7.1-2 session lane 源码](https://github.com/openclaw/openclaw/blob/v2026.7.1-2/src/process/command-queue.ts)
- [OpenClaw 2026.7.1-2 发布记录](https://github.com/openclaw/openclaw/releases/tag/v2026.7.1-2)
