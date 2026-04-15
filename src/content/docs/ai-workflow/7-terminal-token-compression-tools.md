---
title: "终端输出压缩：RTK 与 Navi 在 AI 编程中的实战"
description: "AI 编程工具每次执行命令都会消耗 token。RTK 通过 CLI 代理压缩 60-90% 输出，Navi 用 tree-sitter 实现结构化代码导航，两者组合让 AI 上下文更干净。
sidebar:
  order: 7
---

# 终端输出压缩：RTK 与 Navi 在 AI 编程中的实战

AI 编程工具每次 `git status`、`cargo test` 都是 token 消耗。大部分输出对 AI 没用——颜色、badge、进度条、空行、表格边框全是噪音。

两个工具解决两个问题：**RTK** 压缩命令输出体积，**Navi** 用 tree-sitter 提供结构化代码导航。

---

## 1. RTK（Rust Token Killer）

**官网**: <https://rtk-ai.app> | **GitHub**: <https://github.com/rtk-ai/rtk>

RTK 是一个 CLI 代理，拦截 AI 工具调用的 shell 命令，过滤噪音后返回紧凑输出。核心数字：**60-90% token 节省**。

### 原理

RTK 在 AI 工具执行 shell 命令前拦截（通过 `PreToolUse` hook），将原始命令改写为 `rtk` 前缀，原始命令输出经过四层过滤：

1. **Smart Filtering** — 移除注释、空行、badge、HTML 标签
2. **Grouping** — 相同类型的条目合并（文件按目录聚合）
3. **Truncation** — 超长输出截断，保留头部和关键错误
4. **Deduplication** — 重复的警告、路径等只保留第一条

### 安装

```bash
# macOS
brew install rtk

# Linux/macOS 一键
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh

# 验证（注意：另一个 rtk 是 Rust Type Kit，要确认是 Token Killer）
rtk gain  # 显示 token 节省统计的是正确版本
```

### 接入 AI 工具

```bash
# 全局接入 Claude Code（推荐）
rtk init -g

# 对于 OpenCode，需要手动配置 hook
# 参考 hooks/opencode/ 目录下的说明
```

接入后，以下命令自动被压缩：

| 命令 | 标准输出 | RTK 输出 | 节省 |
|------|---------|---------|------|
| `git status` | ~2,000 tokens | ~200 tokens | -90% |
| `git log -n 10` | ~2,500 tokens | ~500 tokens | -80% |
| `cargo test` | ~25,000 tokens | ~2,500 tokens | -90% |
| `npm run build` | ~10,000 tokens | ~1,000 tokens | -90% |

### 手动调用

不通过 hook 时也可以直接调用：

```bash
rtk git status        # 紧凑 git 状态
rtk git log -n 10    # 单行 commit 历史
rtk git diff         # 过滤后的 diff
rtk cargo test       # 只显示失败
rtk err npm run build  # 只显示错误和警告
rtk test pytest      # pytest 失败只显示 FAILED 行
rtk gain             # 查看 token 节省统计
rtk gain --graph     # ASCII 可视化
```

### 代理模式（绕过过滤）

如果需要完整输出（但仍想追踪使用量）：

```bash
rtk proxy git log --oneline -20  # 原始输出，不经过过滤
```

### 支持的 AI 工具

Claude Code、GitHub Copilot (VS Code)、Cursor、Cline/Windsurf、Codex CLI、**OpenCode**（通过 TypeScript plugin）。Hook 机制和配置方式因工具而异，详见 GitHub 仓库。

---

## 2. Navi — Tree-sitter 结构化代码导航

**GitHub**: <https://github.com/keanji-x/Navi>

Navi 是一个 headless 代码导航 CLI，基于 ast-grep/tree-sitter，**零 ANSI 噪音，输出专为 LLM 设计**。它解决的是 AI 在大代码库里"看哪里"的问题。

### 核心原理

用 tree-sitter 解析代码 AST，返回结构化、去噪后的符号信息。输出只含：文件路径、行号、符号类型（function/class/struct），函数体默认折叠。AI 看到的不再是几千行的文件内容，而是精确的代码骨架。

### 安装

```bash
# 一键安装（包含 Rust + ast-grep 依赖）
curl -sSf https://raw.githubusercontent.com/keanji-x/Navi/main/install.sh | bash

# 或手动
cargo install ast-grep
cargo install navi
```

### 命令速查

| 命令 | 用途 |
|------|------|
| `navi list <file>` | 文件骨架（函数折叠） |
| `navi jump <sym> <file>` | 跳转到符号定义 |
| `navi refs <sym>` | 查找符号所有引用 |
| `navi read <file>:<start>:<end>` | 读精确行范围 |
| `navi tree [dir]` | 目录递归骨架 |
| `navi outline [dir]` | 项目架构概览 |
| `navi callers <sym>` | 查找调用点（排除 import） |
| `navi deps <file>` | 导入/反向导入图 |
| `navi types <sym>` | 递归展开类型定义 |
| `navi scope <file>:<line>` | 显示所在作用域 |
| `navi diff <sym>` | Git diff 只看某符号的变更 |
| `navi sg [args...]` | 直接调用 ast-grep |

### 使用示例

```bash
# 看文件骨架，不加载函数体
navi list src/main.rs

# 输出示例：
# src/main.rs
# ├─ fn main()         line 1
# ├─ struct Config     line 10
# │  ├─ field api_key  line 12
# │  └─ field endpoint line 13
# └─ fn init()         line 20

# 查找某符号的所有引用
navi refs parse_config src/main.rs

# 输出：
# src/handler.rs:45:5 parse_config  # call
# src/main.rs:20:0 parse_config      # definition
# tests/test.rs:12:3 parse_config    # test call

# 精确行范围（比 cat 更精确）
navi read src/main.rs:20:40

# 目录树骨架
navi tree src/

# Git diff 只看某函数变更
navi diff parse_config  # git diff 结果只包含该函数的变更
```

### 支持语言

Rust、TypeScript/TSX、JavaScript、Python、Go、Java、C/C++/C#、Ruby、Swift、Kotlin、Scala、PHP、Ruby、Lua、Bash、CSS、HTML、JSON、YAML、Solidity、Elixir、Haskell、Nix、HCL 等 26+ 语言。

### AI Skill 文档

```bash
navi init  # 在当前目录生成 .agent/skills/navi.md
```

生成的 skill 文档描述了所有命令和输出格式，AI 编程工具会自动发现并使用。

---

## 3. 两者如何协同

```
AI 编程工具
  ├── 执行命令 ──→ RTK hook ──→ shell ──→ RTK 过滤 ──→ 压缩后的命令输出
  └── 读代码   ──→ Navi ──→ tree-sitter ──→ 结构化符号输出
```

典型场景：

```bash
# AI 想了解项目结构
git status          ──→ RTK ──→ 3 行精简状态
navi tree src/      ──→ Navi ──→ 项目骨架

# AI 想定位一个 bug
navi refs bug_fn    ──→ 所有调用点
rtk cargo test      ──→ 只显示失败的测试

# AI 想看某个函数的变更历史
navi diff handle_request  ──→ 只包含该函数的 diff
```

---

## 4. 适用场景

**RTK 最适合**：高频日常命令（git 系、test 系、build 系），这些命令输出量大但信息密度低。

**Navi 最适合**：大代码库导航、多文件依赖分析、精确查找符号定义和引用。

两者都服务于同一个目标：**让 AI 的上下文更干净，token 用在刀刃上。**

---

## 5. 注意事项

- RTK 的 hook 机制因 AI 工具而异，OpenCode 需要参考仓库中的 `hooks/opencode/` 手动配置
- Navi 输出默认折叠函数体，如果 AI 需要看实现细节，用 `navi read` 精确获取行范围
- RTK 的 `rtk gain` 可以量化 token 节省，用 `rtk proxy` 可以绕过过滤但保留使用追踪
