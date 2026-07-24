---
title: "CC Switch：五大 AI 编程工具的统一管理面板"
description: "CC Switch 是一个跨平台桌面应用，通过可视化界面管理 Claude Code、Codex、OpenCode、OpenClaw、 Gemini CLI 的 API 配置、MCP 和 Skills，解决多工具切换时手动改配置的痛点。"
sidebar:
  order: 9
---

# CC Switch：五大 AI 编程工具的统一管理面板

GitHub: <https://github.com/farion1231/cc-switch> | 当前 Star: 44K+

---

## 1. 它解决什么问题

Claude Code、Codex、OpenCode、OpenClaw、Gemini CLI 这五个主流 AI 编程 CLI 工具各自有独立的配置文件格式（JSON、TOML、.env），切提供商时要手动改文件，没有统一管理入口。

CC Switch 用一个 Tauri 桌面应用把这个流程可视化：**一个界面管理全部五个工具的 Provider、MCP、Skills 配置**。

---

## 2. 核心功能

### Provider 管理

- 支持 5 个工具：**Claude Code、Codex、OpenCode、OpenClaw、Gemini CLI**
- **50+ 内置 Provider 预设**，一键导入
- 自定义 Provider 配置（API URL、API Key、模型映射）
- Provider 快速切换
- SQLite 数据库存储，原子写入保护配置不损坏

### MCP 管理

- 可视化配置 MCP Server
- 连接外部工具和数据源

### Skills 管理

- 一键从 GitHub 仓库安装 Skills（自动发现 + 批量更新）
- 支持 `ComposioHQ/awesome-claude-skills` 等预配置仓库
- Skills 备份/恢复生命周期
- SHA-256 增量更新检测

### 系统托盘

- 托盘图标快速切换 Provider
- 轻量模式（只保留托盘，不占窗口）

---

## 3. 安装

### macOS

```bash
brew tap farion1231/ccswitch
brew install cc-switch
```

### Windows

下载 `CC-Switch-v{version}-Windows.msi`（推荐 MSI 安装器，带自动更新）或 `CC-Switch-v{version}-Windows-Portable.zip`（便携版）。

### Linux

```bash
# 从 releases 下载 AppImage 或 .deb
# 或通过 Homebrew
brew install cc-switch
```

---

## 4. 基本使用

### 首次启动

1. 启动后选择要管理的 CLI 工具（可以多选）
2. 如果已有配置，选择"导入现有配置"作为默认 Provider
3. 进入主界面

### 添加 Provider

1. 点击 **Add Provider**
2. 选择一个内置预设（如 OpenAI Official、Claude Official）或创建自定义配置
3. 填入 API Key 和 Endpoint
4. 保存

### 切换 Provider

1. 在工具列表选择目标工具（如 Claude Code）
2. 从 Provider 下拉选择目标配置
3. 点击切换，立即生效

### 安装 Skills

1. 切换到 **Skills** 标签
2. 点击 **Add from GitHub**
3. 输入仓库地址（如 `ComposioHQ/awesome-claude-skills`）
4. 选择要安装的 Skill，一键安装

---

## 5. Provider 预设（部分）

| 提供商 | 类型 | 备注 |
|--------|------|------|
| Claude Official | 官方 | 需要 Anthropic API Key |
| OpenAI Official | 官方 | GPT-4o 等 |
| Google Official | 官方 | Gemini 系列 |
| GitHub Copilot | 代理 | OAuth 设备码认证 |
| PackyCode | 第三方中转 | API 中继服务 |
| TheRouter | 第三方中转 | 多模型中转 |
| Silicon Flow | 第三方中转 | OpenAI 兼容格式 |

---

## 6. GitHub Copilot 反代支持（v3.12.3+）

CC Switch 支持将 GitHub Copilot 作为 Claude Code 的 Provider：
- 实现 OAuth Device Code 认证流程
- 自动刷新 Token
- Anthropic ↔ OpenAI 格式转换
- 实时获取模型列表和使用统计

> ⚠️ 使用 Copilot 反代功能风险自负，GitHub 可能对账户进行限制或警告。

---

## 7. 注意事项

- 配置文件由 CC Switch 管理后，建议不要再手动编辑（会被覆盖）
- macOS 版已实现 Apple 代码签名 + 公证，消除安装时的安全提示
- SQLite 数据库确保原子写入，崩溃不会导致配置损坏
- Provider 变更后对应 CLI 工具需要重启才能生效
