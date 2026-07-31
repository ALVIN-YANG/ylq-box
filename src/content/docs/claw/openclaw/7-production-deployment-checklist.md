---
title: "OpenClaw 生产部署检查：Gateway、权限、隔离与回滚"
description: "从单操作者信任模型出发，检查 Gateway 暴露、凭证、Tool 权限、健康探针、备份和升级回滚。"
date: 2026-04-10
lastUpdated: 2026-06-02
verifiedAgainst: "OpenClaw 官方 Install、Docker 与 Gateway Security 文档，2026-06-02"
sidebar:
  order: 7
---

OpenClaw 本地跑起来并不难，真正容易踩坑的是把同一套配置搬到 VPS 或局域网之后：Gateway 暴露范围扩大了，Channel 可以持续接收输入，Tool 还能访问文件、命令和第三方系统。

生产部署的重点不是让进程一直在线，而是先明确它代表谁、能做什么，以及失控时怎么停下来。

## 先说结论

- 一个 Gateway 默认对应一个可信操作者边界，不要把它当成对抗性多租户隔离层。
- 优先保持 loopback，通过可信隧道访问；非 loopback 暴露必须同时配置认证和防火墙。
- Tool 权限按任务最小化，高风险操作不能只依赖 Prompt 约束。
- 升级前保存版本、配置和数据快照，健康检查通过不等于真实 Channel 与 Tool 已验收。

## 先确认信任模型

官方安全文档明确采用个人助手信任模型：一个 Gateway 面向一个可信操作者边界。如果多个互不信任的用户共享同一个 Tool-enabled Agent，他们实际上共享了 Agent 被授予的工具权限。

多用户或多组织场景应拆成独立单元：

```text
独立 Gateway
+ 独立凭证
+ 独立状态目录
+ 独立 OS 用户或主机
+ 独立网络与资源限制
```

`sessionKey` 用于路由会话，不是授权令牌。

## 安装方式怎么选

| 场景 | 建议 |
|---|---|
| 个人电脑长期运行 | 官方 CLI + 托管后台服务 |
| 临时隔离测试 | Docker |
| VPS 或固定服务器 | systemd 用户服务或 Docker |
| 多信任边界 | 每个边界独立 Gateway |

安装后先验证：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

记录实际版本，不要只写 `latest`。

## Gateway 暴露

默认优先使用 loopback。需要远程访问时，更推荐：

- Tailscale Serve 或等价可信隧道；
- Gateway 仍监听本地地址；
- 外部访问由隧道负责身份和网络边界。

如果必须使用 `lan`、`tailnet` 或 `custom`：

- 配置 Gateway token 或 password；
- 设置真实防火墙；
- 限制 Control UI allowed origins；
- 不暴露无认证的反向代理路径；
- 不把 Canvas 与特权控制面放在不可信同源环境。

## 先跑安全审计

每次修改网络、Channel 或 Tool 配置后运行：

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --json
```

`--fix` 只适合应用官方定义的安全修复，执行前仍要检查 diff：

```bash
openclaw security audit --fix
```

## Tool 与命令权限

对于会处理网页、邮件或陌生用户内容的 Agent，默认拒绝控制面敏感工具，再按需要开放。

重点检查：

- 谁可以发送 Slash Command；
- Channel allowlist 是否包含通配符；
- 是否允许 `system.run`；
- Gateway、Cron 和跨会话工具是否真的需要；
- 文件访问范围；
- Browser 与网络 egress；
- 发信、付款、删除等动作的审批；
- 重试是否可能重复产生副作用。

模型可以提出动作，但身份、授权和审批必须在执行层验证。

## 凭证和持久化目录

- `.env`、认证 Profile 和 Gateway token 不进入 Git；
- 文件权限限制到运行用户；
- 容器升级时持久化状态目录；
- 不把宿主 Docker Socket 挂进 Agent Sandbox；
- 日志开启敏感信息脱敏；
- 定期轮换长期凭证；
- 备份前确认快照中是否包含密钥。

## 健康检查分三层

### 进程存活

```bash
curl -fsS http://127.0.0.1:18789/healthz
```

### 服务就绪

```bash
curl -fsS http://127.0.0.1:18789/readyz
```

### 深度检查

```bash
openclaw health
```

真正验收还要走一条业务链路：

```text
Channel 收到消息
→ Agent 正确路由
→ Tool 在预期权限内执行
→ 用户收到结果
→ Trace 和日志可以还原过程
```

## 升级与回滚

升级前保存：

- 当前 OpenClaw 版本；
- 配置文件校验和；
- 插件与 Skill 版本；
- 状态目录快照；
- 镜像 digest 或安装包版本；
- 一组最小验收任务。

升级后依次验证：

1. Gateway 启动；
2. Security Audit；
3. Channel 登录状态；
4. 模型调用；
5. 关键 Tool；
6. 定时任务；
7. 重启后的状态恢复。

回滚不能只降二进制版本，还要确认配置和状态格式是否兼容。

## 发布前检查

- 一个 Gateway 对应一个可信操作者边界；
- 网络暴露范围明确；
- Gateway 认证与防火墙已启用；
- Security Audit 无未解释高风险项；
- Tool、命令和 Channel 使用 allowlist；
- 凭证不进入仓库和日志；
- 状态目录可备份、可恢复；
- 健康探针和真实业务验收都通过；
- 升级版本固定；
- 回滚步骤实际演练过。

延伸阅读：

- [OpenClaw：Install](https://docs.openclaw.ai/install)
- [OpenClaw：Docker](https://docs.openclaw.ai/install/docker)
- [OpenClaw：Gateway Security](https://docs.openclaw.ai/gateway/security)
