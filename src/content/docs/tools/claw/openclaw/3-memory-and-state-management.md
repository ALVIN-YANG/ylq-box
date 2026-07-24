---
title: "[进阶玩法] 让你的 OpenClaw 拥有超长记忆：引入向量数据库与状态机"
description: "上下文窗口永远是不够用的。本文带你破解 LLM 的记忆瓶颈，揭秘如何在 OpenClaw 中无缝接入 ChromaDB 实现长期记忆，并用状态机拯救多步推理。"
sidebar:
  order: 3
---

# 让你的 OpenClaw 拥有“超长记忆”：向量数据库与状态机落地

前面我们搞定了基础概念，也手撸了直连业务数据库的插件。这时候你的 OpenClaw Agent 看起来已经是个像模像样的数字员工了。

但如果你真的把它放进生产环境，让它处理一份 50 页的文档，或者陪一个真实用户聊上两个小时，你会发现一个让人崩溃的现象：**这货的脑容量只有七秒。**

刚告诉它的上下文，聊两句它就忘了；刚查出来的复杂业务规则，它做决策的时候偏偏不用。

为什么？因为 **Token 是要钱的，而且 Context Window 永远是不够用的。**

今天，我们就来解决 Agent 开发中最痛的两个问题：**如何实现低成本的“长期记忆”（Long-Term Memory）？如何保证在超长对话中不丢失当前的任务状态（State Machine）？**

## 1. 为什么“把聊天记录全塞进去”是个蠢主意？

最简单的记忆管理方案是什么？把 `message_history` 这个数组越攒越长，每次请求大模型都把前 100 轮对话全带上。

别笑，我见过无数开源小玩具就是这么写的。

这种做法在生产环境中有两个致命问题：
1. **烧钱如流水**：假设你每次带 4K 的历史 Token，哪怕按 GPT-3.5 的白菜价算，一天下来光历史记录的轮询费用就能买好几杯星巴克。如果是 GPT-4o，你得破产。
2. **“迷失在中间”（Lost in the Middle）**：这是 LLM 领域的经典难题。即使现在的模型支持 128K 甚至 1M 的超大上下文，如果你把一堆废话塞在 Prompt 中间，模型在提取关键信息时大概率会“眼瞎”。

所以，**真正的企业级 Agent 架构，必须做到“按需提取记忆”。**

## 2. 引入 ChromaDB：让记忆变成外挂硬盘

怎么做到“按需提取”？答案是：**向量数据库（Vector Database） + RAG（检索增强生成）机制**。

与其让模型死记硬背，不如给它一个“图书馆”。在 OpenClaw 中，我们可以开发一个内置的插件，专门负责“把关键信息存入向量库”和“从向量库里搜出过去的事”。

这里我们选用轻量级的本地向量数据库 **ChromaDB**。

### 实战：编写记忆插件

在 OpenClaw 的生态里，写个记忆管理插件非常简单。我们需要提供两个核心方法给模型：`store_memory` 和 `recall_memory`。

```typescript
import { ClawPlugin, z } from 'openclaw';
import { ChromaClient } from 'chromadb';
// 你需要一个 Embedding 模型将文本转成向量
import { OpenAIEmbeddings } from '@langchain/openai'; 

const StoreMemorySchema = z.object({
  fact: z.string().describe('需要长期记住的重要事实，例如用户的偏好、约定的规则或过去的关键决策。'),
});

const RecallMemorySchema = z.object({
  query: z.string().describe('你想回忆的事情或关键词，我将去过去的对话记忆里帮你检索。'),
});

export class LongTermMemoryPlugin extends ClawPlugin {
  private chroma: ChromaClient;
  private embeddings: OpenAIEmbeddings;
  private collectionName = 'agent_memory_vault';

  constructor() {
    super();
    this.chroma = new ChromaClient({ path: "http://localhost:8000" });
    this.embeddings = new OpenAIEmbeddings();
  }

  // 初始化：确保 Collection 存在
  async init() {
    await this.chroma.getOrCreateCollection({ name: this.collectionName });
  }

  get tools() {
    return [
      {
        name: 'store_memory',
        description: '当用户告诉你一些重要信息（如喜好、地址、重要设定）时，使用此工具将它们永久保存。',
        parameters: StoreMemorySchema,
        execute: async ({ fact }) => {
          const collection = await this.chroma.getCollection({ name: this.collectionName });
          // 生成唯一 ID 并存入向量库
          const id = `mem_${Date.now()}`;
          const vector = await this.embeddings.embedQuery(fact);
          
          await collection.add({
            ids: [id],
            embeddings: [vector],
            documents: [fact],
          });
          return '记忆已成功保存至长期存储区。';
        }
      },
      {
        name: 'recall_memory',
        description: '当你需要用到过去的信息，但当前上下文没有时，输入关键词调用此工具去回忆。',
        parameters: RecallMemorySchema,
        execute: async ({ query }) => {
          const collection = await this.chroma.getCollection({ name: this.collectionName });
          const queryVector = await this.embeddings.embedQuery(query);
          
          const results = await collection.query({
            queryEmbeddings: [queryVector],
            nResults: 3, // 取最相关的 3 条记忆
          });
          
          if (results.documents[0].length === 0) return '没有找到相关的记忆。';
          return `找到以下历史信息：\n${results.documents[0].join('\n')}`;
        }
      }
    ];
  }
}
```

### 为什么这招管用？

把这个插件扔给 Agent 后，你会发现魔法发生了：

用户：“我特别讨厌吃香菜，点外卖时千万别加。”
Agent 收到后，会自动调用 `store_memory({ fact: "用户讨厌吃香菜" })`。

一个月后，用户说：“帮我点个牛肉面。”
此时由于历史对话早就被清空了，但 Agent 可以调用 `recall_memory({ query: "用户关于食物的偏好" })`。ChromaDB 会返回“讨厌香菜”，Agent 就会在下单插件里自动加上“备注：不加香菜”。

这就是真正的智能：**自主决定何时记忆，何时回忆，且内存成本极低。**

## 3. 告别死循环：状态机（State Machine）在多步推理中的应用

如果你写过稍微复杂点的 Agent（比如让它去爬取网页，分析数据，然后写份研报，最后发邮件），你一定遇到过这种抓狂的场景：

模型第一步做对了，第二步做错了，然后它开始反复重试第二步，最后原地爆炸。

这在业界被称为 **Reasoning Loop (推理死循环)**。

在 OpenClaw 的底层实现中，为了防止这种情况，框架引入了基于状态机（State Machine）的任务管理机制。

如果你要在代码中实现一个复杂的多步任务，千万不要用一个巨大的 Prompt 去逼模型一次性做完。你应该拆分状态。

### 在 Node.js 中如何用 OpenClaw 控制状态流？

```javascript
import { Agent } from 'openclaw';

// 这是一个经典的工作流编排模式
async function runComplexTask() {
  const agent = new Agent({ model: 'gpt-4o' });

  // 状态 1：搜集数据阶段
  console.log('--- 阶段 1：数据搜集 ---');
  agent.setSystemPrompt('你是一个数据搜集员。请调用搜索工具收集某某公司的财报，收集完后总结，然后必须回复大写的 "DATA_READY"。');
  let result1 = await agent.run('开始收集财报数据');
  
  if (!result1.output.includes('DATA_READY')) {
    throw new Error('第一阶段搜集失败！');
  }

  // 状态 2：分析并撰写报告
  console.log('--- 阶段 2：数据分析 ---');
  // 把上一阶段的成果传给下一阶段，但清空无用的历史调用记录（释放 Token）
  agent.clearHistory();
  agent.setSystemPrompt('你是一个金融分析师。根据以下数据写一份 500 字摘要分析。');
  let result2 = await agent.run(`这是原始数据：\n${result1.output}`);

  // 状态 3：发送邮件...
  // ...
}
```

发现没有？高级的 Agent 架构师，从来不会盲目相信模型能在一个黑盒子里跑完所有的流程。
我们通过在 Node.js 中编写显式的状态切换流（StateMachine），把任务硬性切分成多个小的 Agent 上下文。

**这样做的好处：**
1. **防止上下文污染**：上一步搜索失败的报错信息，不会带到下一步写研报的 Prompt 里。
2. **极易调试**：如果失败了，你明确知道是死在“数据搜集”还是“数据分析”。
3. **极度省钱**：`clearHistory()` 砍掉了之前调用各种 Tool 的巨大 Token 开销。

## 4. 总结

在这一篇里，我们跳出了写代码的层面，站在架构师的角度审视了 Agent 的核心瓶颈。

我们用本地向量库 ChromaDB 搞定了外挂记忆，又用 Node.js 的流程控制（状态机理念）破解了 Agent 在复杂任务中的死循环。这就是 OpenClaw 能在企业场景落地必须迈过的两道坎。

但是，随着业务规模的扩大，问题又来了。你挂了几十个好用的插件，配了 ChromaDB，甚至还在后台跑了浏览器自动化测试……你惊奇地发现，云服务的账单和 API 调用费用直接爆表了！

有没有什么黑魔法，能让我们**白嫖**那些昂贵的大模型？

下一篇《[成本黑科技] OpenClaw-Zero-Token 揭秘：如何白嫖大模型 API？》将带你走进开源圈最灰色、也最硬核的逆向工程实战领域，看看那帮极客是如何用浏览器劫持来薅羊毛的。准备好你的瓜子，咱们下期见！
