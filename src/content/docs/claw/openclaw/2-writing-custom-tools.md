---
title: "[核心技术] 深入 OpenClaw 插件系统：手写一个生产级数据库查询 Tool"
description: "别只会调别人写好的轮子。今天带你从源码层面剖析 OpenClaw 的插件加载机制，手把手带你写一个查库机器人的自定义插件，避开业务落地过程中的各种坑。"
sidebar:
  order: 2
---

# 深入 OpenClaw 插件系统：手写一个生产级数据库查询 Tool

在上一篇文章中，我们见识到了 OpenClaw 极其简洁优雅的 API 抽象，以及如何用官方提供的插件在十分钟内搭出一个能联网的 Agent。

但实话实说，如果你只是调别人的轮子，你的 Agent 只能算个玩具。**在真正的企业落地场景里，Agent 的核心价值在于它能理解你们公司的专有业务系统（比如内部 ERP、数据库、CRM）。**

这就要求你必须学会自己写 OpenClaw 的 Plugin（即自定义 Tool）。

今天，废话不多说，我直接带你从源码层面剖析 OpenClaw 的插件加载机制，手把手带你写一个“MySQL 数据库查询助手”，顺便把异步超时处理、AST 参数反射这些硬核知识点全给你捋清楚。

## 1. 为什么手写插件会踩坑？

很多新手刚上手写 Tool 的时候，觉得无非就是写个 Node.js 函数给大模型调用，能有多难？结果一跑就挂，死状千奇百怪：

1. **参数解析失败 (JSON Error)**：模型返回的参数字段不对，或者把 string 当成 number 传了进来，导致你的查库函数直接报错。
2. **死锁与超时 (Timeout)**：数据库查询很慢，模型等得不耐烦了，触发了重试风暴，导致后端连接池被你的 Agent 瞬间打满。
3. **幻觉滥用工具**：模型明明没权限，非要试着调用一下 `drop table`。

所以，一个生产级的 Tool 绝不仅仅是一个裸露的业务函数，它必须要有**健壮的 Schema 校验**和**严格的安全边界**。

## 2. OpenClaw 插件底层是如何运作的？

在手写之前，我们先看看 OpenClaw 源码里是如何把你的 JS 函数转换给大模型的。

OpenClaw 使用了 `Zod` 或 TypeScript 的 AST 反射来动态生成 JSON Schema。当你挂载一个插件时，OpenClaw 的核心类 `PluginManager` 会进行如下操作：

1. 扫描你声明的 `name`（工具名称）和 `description`（工具描述）。
2. 将你的参数定义通过 `zodToJsonSchema` 转换为 OpenAPI 标准的格式。
3. 在请求 OpenAI / Anthropic 时，把这些 Schema 塞进 `tools` 字段。
4. 当模型返回 `tool_calls` 时，OpenClaw 框架自动帮你在沙箱中 `apply()` 这个函数。

理解了这个链路，你就知道：**对插件的 `description` 描述越清晰，模型的调用成功率越高。这比写函数体还要重要！**

## 3. 实战：开发 `MySQLQueryPlugin`

接下来，我们将手写一个能安全查询公司 MySQL 数据库订单表的插件。我们要用的依赖是 `mysql2`。

### 初始化插件骨架

在 OpenClaw 中，一个合规的插件必须继承基类 `ClawPlugin`。创建一个 `plugins/mysql-query.ts`：

```typescript
import { ClawPlugin, PluginConfig, z } from 'openclaw';
import mysql from 'mysql2/promise';

// 1. 定义入参校验 Schema (至关重要)
const QueryOrderSchema = z.object({
  userId: z.string().describe('用户的唯一标识符，通常是邮箱或 UUID'),
  limit: z.number().min(1).max(50).default(5).describe('限制返回的订单数量，最多不允许超过 50 条'),
});

// 2. 实现插件类
export class MySQLQueryPlugin extends ClawPlugin {
  private pool: mysql.Pool;

  constructor(config: { connectionUri: string }) {
    super();
    // 强烈建议使用连接池，因为 Agent 可能会高并发调用
    this.pool = mysql.createPool({
      uri: config.connectionUri,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  // 必须实现的方法：注册工具及其描述
  get tools() {
    return [
      {
        name: 'query_user_orders',
        description: '当用户询问他们的历史订单、物流状态或购买记录时，必须使用此工具查询数据库获取最新数据。注意，只允许查询普通订单。',
        parameters: QueryOrderSchema,
        // 这里绑定具体的执行函数
        execute: this.executeOrderQuery.bind(this),
      },
    ];
  }

  // 具体的执行逻辑
  private async executeOrderQuery(args: z.infer<typeof QueryOrderSchema>) {
    // 框架层会自动用 Zod 校验 args，如果格式不对，大模型会自己收到 Error 并尝试修复
    const { userId, limit } = args;

    try {
      // 安全第一：绝对不能让模型直接拼写 SQL (防 SQL 注入)
      const [rows] = await this.pool.execute(
        `SELECT order_id, status, total_amount, created_at 
         FROM orders 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limit]
      );

      // 返回结果给模型。如果有数据，将其序列化为字符串
      if (Array.isArray(rows) && rows.length > 0) {
        return JSON.stringify(rows);
      } else {
        return `未查询到该用户 (userId: ${userId}) 的任何订单记录。`;
      }
    } catch (error) {
      console.error('数据库查询异常:', error);
      // 捕获异常后要通知模型，让模型去回答用户“系统出错”
      return `[System Error] 查询数据库失败: ${error.message}`;
    }
  }

  // 插件销毁钩子，优雅关闭连接池
  async destroy() {
    await this.pool.end();
  }
}
```

### 关键点解析：避坑指南

注意看上面这段代码，里面藏了三个我们在生产环境中用血肉之躯踩出来的坑：

1. **绝对禁止大模型写裸 SQL**：有些博主会教你让大模型直接输出 SQL 语句，然后你拿去 `pool.query(sql)`。这是**取死之道**。轻则因为模型智障把整张表锁死，重则遇到提示词注入（Prompt Injection）被删库跑路。我们采用的方法是：**把业务意图（查询订单）封装成特定的 Tool，模型只能传入 `userId` 这个参数。** 真正的 SQL 是写死在 Node.js 代码里的。
2. **Schema 中严格的边界控制**：在 Zod Schema 中，我限制了 `limit.max(50)`。这防止了大模型发癫，请求返回一千万条数据直接撑爆 Node.js 的 V8 内存限制。
3. **返回人类可读的友好提示**：如果查询结果为空，直接返回一个空数组 `[]` 给模型，它有时候会瞎编。所以我明确返回了字符串：“未查询到该用户...”。这样模型在组装最终答案时，语言会更有逻辑。

## 4. 将插件注入 Agent

最后，在你的主程序里，把这个插件扔给 Agent。

```javascript
import { Agent } from 'openclaw';
import { MySQLQueryPlugin } from './plugins/mysql-query';

async function main() {
  // 生产环境务必从环境变量读取敏感信息
  const mySqlPlugin = new MySQLQueryPlugin({
    connectionUri: process.env.DB_CONNECTION_STRING
  });

  const agent = new Agent({
    model: 'gpt-4o',
    systemPrompt: '你是电商平台的智能客服。'
  });

  // 挂载我们手写的牛逼插件
  agent.use(mySqlPlugin);

  // 开始测试
  const result = await agent.run('帮我查一下用户 alex@ilovestudy.club 最近买的两单记录，状态都是什么？');
  
  console.log(result.output);

  // 任务结束后一定要记得销毁插件释放数据库连接
  await mySqlPlugin.destroy();
}
```

## 5. 总结

至此，你已经从一个“只会调用 API 的脚本小子”，进阶为了“掌握业务控制权的高级调参工程师”。

在这篇文章中，我们手撸了一个基于 Node.js `mysql2` 的数据库查询插件，并且学会了如何用 Zod 保护系统的安全底线。

然而，聪明的你可能已经发现了一个问题：**Agent 虽然能查数据了，但它是个金鱼脑子。** 你刚问完“Alex的订单”，再问一句“那帮我把他的收货地址也查出来”，它立马会问你“谁是 Alex？”

在下一篇文章《[进阶玩法] 让你的 OpenClaw Agent 拥有“长期记忆”》中，我将带你破解 Agent 的多轮对话困境，并引入向量数据库为你的机器人插上过目不忘的翅膀！
