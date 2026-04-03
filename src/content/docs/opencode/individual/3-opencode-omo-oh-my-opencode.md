---
title: "OpenCode 装上 Oh My OpenCode（OMO）：从安装到日常按键，我实际怎么用它"
description: "一份偏操作说明的笔记：OpenCode 与 OMO 的分工、安装与鉴权流程、配置文件叠放规则、终端里常用交互，以及手机/平板通过 SSH 时的踩坑与折中。"
sidebar:
  order: 3
---

# OpenCode 装上 Oh My OpenCode（OMO）：从安装到日常按键，我实际怎么用它

先把话说死：**OpenCode 是底座，Oh My OpenCode（社区里常叫 OMO）是挂在底座上的一层插件**。你可以把它理解成：OpenCode 负责「能连模型、能调工具、能改文件」；OMO 负责「把同一件事拆给不同角色去做、顺手塞一堆自动化钩子、把任务流串起来」。

下面这篇文章不写口号，只写我（以及官方安装文档里）真正会碰到的路径、命令和界面动作。文中涉及安装参数、配置文件位置、Agent 名称等内容，**以 OpenCode 与 OMO 上游仓库当前文档为准**；它们迭代很快，你若发现命令不一致，优先以官方为准。

**参考链接（建议收藏）：**

- OpenCode 安装与使用：<https://opencode.ai/docs>
- OMO 安装指南（raw，适合丢给另一个 Agent 照着做）：<https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md>
- OMO 配置参考：<https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/docs/reference/configuration.md>
- 项目主页（品牌站）：<https://ohmyopencode.com/>
- 上游仓库（曾用名 oh-my-opencode，包名仍为 `oh-my-opencode`）：<https://github.com/code-yeongyu/oh-my-openagent>

---

## 让 OpenCode 代劳安装：一段通用话术（复制即用）

上游安装文档的 **「For Humans」** 写法本来就是：把下面**整句**丢进任意 LLM / Agent 会话，让它去读链接并按步骤做（见 [installation.md](https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md) 开头）：

```text
Install and configure oh-my-opencode by following the instructions here:
https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md
```

英文环境这一句就够。若你**主要用中文跟 OpenCode 说话**，又不想它漏掉 `--no-tui`、`--claude=max20` 这类细节，建议用下面这段**更啰嗦、但更稳**的话术（仍以上游 raw 文档为唯一流程依据；文档还要求 **Agent 用 `curl` 拉原文**，不要用会丢参数的「网页摘要」类工具）：

```text
请在本机为我安装并配置 Oh My OpenCode（npm 包名 oh-my-opencode；opencode.json 里插件名可能是 oh-my-openagent）。

第一步：用终端执行下面命令，把安装指南的完整原文读进上下文（不要用会省略标志位、订阅选项的网页摘要工具）：
curl -fsSL https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md

若当前环境不能执行 curl，则请你仅依据该 URL 对应文档的完整内容操作，链接是：
https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md

第二步：按文档「Step 0」逐项问我有哪些订阅（Claude 是否 Max20、OpenAI、Gemini、Copilot、OpenCode Zen、Z.ai Coding Plan、OpenCode Go 等），再根据我的回答拼出正确的非交互安装命令，例如文档里的：
bunx oh-my-opencode install --no-tui --claude=... --openai=... --gemini=... --copilot=... （其余开关按文档与我实际情况补全）
不要替我默认全是 yes。

第三步：确认本机已有 opencode CLI（opencode --version；版本要求以文档为准），再执行安装；完成后运行 bunx oh-my-opencode doctor，并把需要我本人在浏览器里完成的 opencode auth login 步骤列成清单。

若我没有 Claude 订阅，请按文档提醒：Sisyphus 体验可能明显偏弱，不要隐瞒。
```

**最短链接（收藏用）**：与上面 `curl` 指向的是同一份文件——[OMO 官方安装指南（raw）](https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/refs/heads/dev/docs/guide/installation.md)。配置细节仍以 [configuration 参考](https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/docs/reference/configuration.md) 为准。

---

## 这张图先看一眼：东西叠在一起长什么样

![OpenCode 与 OMO 的分层示意](/images/opencode/omo-architecture.svg)

*说明：图里英文仅为避免矢量图编码问题；你只要记住「你在最上，OpenCode 在中间，OMO 在下面把活分给不同 Agent」即可。*

我用自己的话总结一下**和「只装 OpenCode」相比，多了什么体感**：

- **多 Agent**：不是永远同一个「人格」在回你；有的偏检索，有的偏写代码，有的偏把计划写清楚（具体名字见上游 configuration 文档里的 Agents 一节）。
- **Hooks / 任务**：官方配置文档里有一长串特性说明（Skills、Hooks、Browser、TSP 等）。你不用一次全搞懂，先装起来能跑，再按需关。
- **模型解析链**：安装器会问你有哪些订阅（Claude、OpenAI、Gemini、Copilot、OpenCode Zen / Go 等），然后**按 Agent 维度**去配默认模型与回退链——这点和「全局只选一个模型」完全不同，后面会再提。

---

## 安装前：别急着复制粘贴

### 1）OpenCode 必须先存在

安装文档里写得很直白：如果 `opencode` 命令都没有，就先按 OpenCode 官方文档装好。自检可以敲：

```bash
command -v opencode && opencode --version
```

上游安装说明里提到 **OpenCode 版本宜在 1.0.150 或更高**（数字随时间会变，以文档为准）。版本太老时，插件注册或鉴权流程可能对不上。

### 2）想清楚你「真实拥有」的订阅

安装器会围绕这些布尔问题决定非交互参数（下面表格概括自上游安装文档）：

| 问题 | 对应 CLI 参数（示例） | 备注 |
|------|------------------------|------|
| 是否有 Claude Pro/Max | `--claude=yes` / `no` / `max20` | 文档明确提醒：**没有 Claude 时，Sisyphus 可能不理想** |
| 是否用 OpenAI / ChatGPT Plus | `--openai=yes` / `no` | 影响 Oracle 等 Agent 的默认走向 |
| 是否接 Gemini | `--gemini=yes` / `no` | 可能要额外插件与模型表合并 |
| 是否有 GitHub Copilot | `--copilot=yes` / `no` | 常作为 fallback 提供方 |
| 是否有 OpenCode Zen | `--opencode-zen=yes` / `no` | 使用 `opencode/` 模型目录 |
| 是否有 OpenCode Go | `--opencode-go=yes` / `no` | 订阅型套餐，文档有单独说明 |
| 是否有 Z.ai Coding Plan | `--zai-coding-plan=yes` / `no` | 与部分 Agent / 回退链相关 |

**不要装面子**：没有的就写 `no`，否则后面模型解析失败，你只会看到一堆莫名其妙的 fallback。

### 3）包名与「改名期」

上游 README 说明：发布的 npm 包、二进制仍叫 **`oh-my-opencode`**；`opencode.json` 里插件项**更推荐**写 **`oh-my-openagent`**，旧的 `oh-my-opencode` 仍兼容但可能告警。配置文件名同理：`oh-my-openagent.json(c)` 与 `oh-my-opencode.json(c)` 并存一段时间。

---

## 安装：交互式 vs 一口气装完

### 方式 A：交互安装（适合第一次）

```bash
bunx oh-my-opencode install
```

或：

```bash
npx oh-my-opencode install
```

文档写 **推荐 bunx**；并说明 CLI 带独立二进制，装完后**执行 CLI 本身不一定还要常驻本机 Bun/Node**。支持平台含 macOS（ARM64/x64）、Linux、Windows 等——以安装时提示为准。

跟着 TUI 把订阅问完即可。过程中它会去改你的 `opencode.json` 插件列表，并按你的订阅写入默认模型策略。

### 方式 B：非交互（适合脚本、CI、或你早就想好自己的订阅组合）

模板（来自上游文档）：

```bash
bunx oh-my-opencode install --no-tui \
  --claude=yes \
  --openai=no \
  --gemini=no \
  --copilot=no
```

把每一项换成你真实情况。文档给了很多组合示例，例如「只有 Copilot」「只有 OpenCode Zen」「Claude + OpenAI」等，可直接对照 raw 安装文档复制改参数。

### 装完先别写需求：跑一遍 doctor

```bash
bunx oh-my-opencode doctor
```

它会做系统、配置、工具、模型解析之类的检查；若提示 **legacy package name**，按提示把 `opencode.json` 里的插件名从 `oh-my-opencode` 迁到 `oh-my-openagent` 即可。

---

## 鉴权：这一步最容易「卡住但其实是界面问题」

以下流程以 **Anthropic（Claude）** 为例，和我在终端里实际点选顺序一致（具体文案随 OpenCode 版本可能微调）：

1. 执行：

   ```bash
   opencode auth login
   ```

2. 在交互界面里先找到 **Provider**，选 **Anthropic**。
3. 再选登录方式里与 **Claude Pro/Max** 相关的一项（名称以你屏幕为准）。
4. 终端里如果出现 **浏览器链接**，用本机默认浏览器打开，走完 OAuth。
5. 回到终端，确认没有报错；再 `opencode models` 看列表是否出现预期模型。

**Gemini / Antigravity** 一类流程在上游文档里更长：可能要额外加 `opencode-antigravity-auth@latest` 插件，并把模型表合并进 `opencode.json`，再在插件配置里覆盖部分 Agent 的模型名。这里不展开抄全文，避免我抄错一行害你启动失败；你按 raw 安装文档里「Google Gemini」那一节逐步做即可。

**GitHub Copilot** 在文档里是明确作为 **fallback provider** 描述的，且「优先级是 Agent 维度」的——意思是：别以为开了 Copilot 就等价于所有 Agent 都满血。

---

## 配置文件到底在哪：叠放规则比你想的重要

![用户配置与项目配置的覆盖关系](/images/opencode/omo-config-layers.svg)

*说明：图中第一行表示用户主目录下的 `~/.config/opencode/`（macOS/Linux 常见布局）；Windows 对应 `%APPDATA%/opencode/`。*

上游 configuration 文档的核心就一句话：**先读用户级，再读项目级；项目级覆盖用户级**。路径记这个表就够了：

| 作用域 | 典型路径（macOS/Linux） |
|--------|-------------------------|
| 用户 | `~/.config/opencode/oh-my-openagent.json` 或 `.jsonc`（以及旧名 `oh-my-opencode`） |
| 项目 | `项目根/.opencode/oh-my-openagent.json(c)`（及旧名） |

另外有一个很容易踩坑的点：文档写明 **若同一目录下新旧文件名都在，当前实现会优先认旧 basename**。我的做法是：**每个目录只留一份**，别让它猜。

JSONC 的好处是你可以写注释、尾逗号；还可以加 `$schema` 换编辑器自动补全（URL 见上游 configuration 文档示例）。

---

## 终端里怎么「挪动」：我常用的操作顺序

OpenCode 的 TUI 不同版本快捷键会有差异，但有几件事是共通的：

1. **会话**：先搞清楚自己是不是进了对的项目目录；需要切换会话时用 **`/sessions`**（斜杠命令）打开列表，选中再继续。别在手滑时开一堆空会话，后面你自己都嫌烦。
2. **Agent / 模式**：用 **`/agents`** 切角色。上游文档提到核心 Agent 在 UI 里有 **Tab 循环顺序**（Sisyphus、Hephaestus、Prometheus、Atlas 等带固定 order）——你可以把它当成「同一个键盘习惯在多版本之间尽量不换」。
3. **模型**：用 **`/models`**。当你发现「明明订阅了但总说没权限」时，十有八九是 **Provider 没登录** 或 **该 Agent 的模型链走不到你有的那个提供商**。

如果你同时用 Cursor 里的技能式工作流：**Plan 与 Build 分开**是有效的——先让「会写计划」的那档把需求拆完，再切到「会动手改仓库」的那档。OMO 这边则是另一套 Agent 命名，但**心智模型是一样的**：别让「写代码的人」在信息不全时硬写。

---

## 手机和平板：不是不能，而是要知道自己在牺牲什么

OpenCode 本质是终端产品；**手机上不是跑不了，而是别指望手势比键盘更快**。我认可的用法只有一种：**SSH 回到一台已经配好环境的开发机**，在远端跑 `opencode`。

![SSH 从移动设备连到开发机跑 OpenCode](/images/opencode/omo-ssh.svg)

### 具体怎么操作（以 iPad + 键盘为例）

1. 在 **固定一台机器**（家里 PC、Mac mini、云主机）上装好 OpenCode + OMO，并完成浏览器鉴权。以后手机只当「显示器 + 键盘」。
2. iPad 上装任意顺手的 SSH 客户端（Termius、Blink、Secure ShellFish 等），配好 **公钥登录**，别每次手输密码。
3. SSH 进去之后，`cd` 到你的仓库根，再 `opencode`。**会话与上下文都在远端**，本地只传字符。
4. OAuth 若再次弹出：优先在 **那台开发机本机屏幕** 上点链接；如果链接出现在 SSH 终端里，**复制到 iPad 浏览器**有时也能完成，但取决于 OpenCode 当时回调监听绑在哪——这一步没有万能口诀，**以终端提示为准**。
5. 外接键盘几乎是硬条件：没有键盘，光用虚拟键盘切 TUI，你会在 `/agents` 和 `/models` 里迷路。

### 我不建议的用法

- 在手机上「从零编译大项目 + 跑 opencode」：发热、耗电、路径难敲，纯属折磨。
- 在公共 Wi‑Fi 下裸 SSH：至少用 VPN 或可信网络；你终端里是真能改代码的。

---

## 常见问题（都是我真见过或文档里写过的）

**1）`bunx` / `npx` 安装直接退出码 1**  
上游 issue 里提到过依赖发布格式问题，部分版本会踩雷。处理顺序：升级 OpenCode、升级安装器版本、换 `bunx` 或 `npx`、看 doctor 输出。别死磕一条命令。

**2）装完模型列表空**  
先 `opencode auth login`，再 `opencode models`。仍空就看 `~/.config/opencode/opencode.json` 是否被写坏 JSON。

**3）Explore / Librarian 很慢或很蠢**  
文档明确说这类 **Utility Agent** 故意用快、便宜的模型；**别手贱把它们改成超大 Opus**，浪费钱还不一定更快。

**4）Prometheus / Atlas 的「两种提示词」**  
configuration 文档解释过：Claude 系吃「细则清单」，GPT 系吃「原则 + 结构化标签」。所以同一个 Agent 名，底层可能随模型家族切换提示词——这不是 bug，是刻意设计。

---

## 收个尾

OMO 不是「再装一个 AI」，而是把 OpenCode **从单会话工具推成一条有角色分工的流水线**。你愿意花时间的话，收益主要在两块：**复杂任务不容易一开场就写偏**，以及 **检索、写码、评审可以并行起来**。

我写文章的习惯是：**装一次，doctor 过，再写三天真实需求**。三天之后你再回来改仓库根目录下的 `.opencode/oh-my-openagent.jsonc`，比一上来抄一份大配置要靠谱得多。

如果你只想记三条命令，那就记这三个：`bunx oh-my-opencode doctor`、`opencode auth login`、`opencode models`。别的都可以慢慢加。
