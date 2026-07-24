---
title: "Kiro：Spec 驱动的 AI 编程实践"
description: "Kiro 是第一个将 spec-driven 开发引入 AI 编程工具的 IDE。它不只帮你写代码，而是把你的 prompt 变成可验证的规格文档，再驱动 AI 按规格交付。"
sidebar:
  order: 8
---

# Kiro：Spec 驱动的 AI 编程实践

大多数 AI 编程工具的核心模式是 **vibe coding**——你一句我一句，边聊边写。这种方式快，但难保证质量、难追踪需求、难协作。

Kiro（<https://kiro.dev>）尝试解决的是从 vibe coding 到工程化开发的问题。它引入了 **Spec-Driven Development**：把你的自然语言需求变成 Markdown 规格文档，AI 按照规格交付，代码变更可对照规格验证。

---

## 1. 核心概念：Spec 是什么

Kiro 里的 Spec 就是一个 Markdown 文档，包含：

- **需求描述**：要做什么
- **Acceptance Criteria**：怎么算完成
- **技术方案**：用什么方式实现

```markdown
# 用户登录模块规格

## 需求
- 支持邮箱 + 密码登录
- 登录失败返回友好错误提示
- 登录成功后 JWT 存入 httpOnly cookie

## Acceptance Criteria
- [ ] 正确密码 → 200 + redirect 到 /dashboard
- [ ] 错误密码 → 401 + "邮箱或密码错误"
- [ ] 无此用户 → 同上（不区分是邮箱错还是密码错）
- [ ] JWT 7 天过期
- [ ] XSS 无法读取 cookie

## 技术方案
- 密码 bcrypt 哈希存储
- JWT secret 从环境变量读取
- 路由：POST /api/auth/login
```

Spec 写好后，Kiro 会分析代码库，生成实现计划，然后逐个任务执行。每个任务的进度可以 checkpoint。

---

## 2. Spec-Driven 开发的工作流

```
描述需求 → Kiro 生成 Spec → 迭代 Spec → AI 分析代码库
  → 生成实现计划 → 按任务执行 → 每个任务可 checkpoint 回滚
  → Hooks 触发测试/构建 → 对照 Acceptance Criteria 验证
```

### Step 1：描述需求

在 Kiro chat 里直接说你要做什么：

```
我想给现有项目加一个用户注册功能，包括邮箱验证和欢迎邮件。
```

### Step 2：生成并迭代 Spec

Kiro 会生成一个 Spec 草稿，你可以修改acceptance criteria 和技术方案，直到它准确反映你的需求。

### Step 3：实现

Kiro 分析代码库后生成任务列表，每个任务有明确目标和验证方式。AI 按任务执行，你可以随时查看进度。

### Step 4：验证

通过 Kiro 的 property-based testing 功能，可以验证代码是否真的满足规格定义的行为（而不只是语法正确）。

---

## 3. Agent Hooks

Kiro 的 Hooks 是事件驱动的自动化机制，在文件保存、提交等事件触发时自动执行预定义任务。

```javascript
// .kiro/hooks/post-save.js
module.exports = {
  onFileSave: async ({ filePath, context }) => {
    if (filePath.endsWith('.test.ts')) {
      // 自动运行相关测试
      return context.runTests(filePath);
    }
  },
  onCommit: async ({ files, context }) => {
    // 提交前检查是否通过 lint
    return context.runLint(files);
  }
};
```

典型用途：
- 文件保存后自动运行单元测试
- 提交前触发 lint + type check
- 生成文档或类型定义
- 触发 CI pipeline

---

## 4. Kiro CLI

Kiro CLI（<https://kiro.dev/cli/>）把 Kiro 的 agent 能力带到终端：

```bash
# 安装
curl -fsSL https://cli.kiro.dev/install | bash

# 在终端使用 Kiro agent
kiro --print "Look at the latest CI failure, find root cause, and apply a fix"

# 自动创建分支、修复、提交
git checkout -b fix/deploy-issue
kiro --print "修复部署问题"

# 多步骤任务
kiro --print "分析 authentication 模块的漏洞，生成修复方案"
```

CLI 与 IDE 共享同一套 steering files、MCP 配置和团队规范，保证终端和 IDE 的行为一致。

支持 Claude Sonnet 4.5、Claude Haiku 4.5 和 Auto（自动选择模型）三种模式。

---

## 5. Kiro 与其他 AI 编程工具的对比

| | Kiro | Cursor | Claude Code | Windsurf |
|--|------|--------|-------------|---------|
| Spec 驱动 | ✅ 一级功能 | ❌ | ❌ | ❌ |
| Hooks 自动化 | ✅ | ❌ | ❌ | ❌ |
| Terminal CLI | ✅ | ❌ | ✅ | ❌ |
| MCP 原生支持 | ✅ | ✅ | ✅ | ❌ |
| Checkpoint/回滚 | ✅ | ❌ | ❌ | ❌ |
| Property-based testing | ✅ | ❌ | ❌ | ❌ |

Kiro 的差异化在于：**把 AI 编程从 vibe coding 拉回工程化流程**，通过 Spec + Hooks + Checkpoint 让 AI 的行为可追踪、可验证、可自动化。

---

## 6. 快速上手

1. 下载 Kiro IDE（<https://kiro.dev>），Windows/Mac/Linux 均有
2. 打开项目，Kiro 自动分析代码库
3. 在 Chat 里描述需求，Kiro 生成 Spec
4. 迭代 Spec，确认后点击 Run
5. 通过 Hooks 配置自动化验证

CLI 安装：
```bash
curl -fsSL https://cli.kiro.dev/install | bash
kiro --print "Hello, spec-driven development"
```

文档：<https://kiro.dev/docs/>
