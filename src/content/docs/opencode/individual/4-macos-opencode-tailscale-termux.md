---
title: "macOS 上远程跑 OpenCode：Tailscale + SSH + Termux"
description: "把 OpenCode 装在 Mac 上，电脑和安卓手机通过 Tailscale 远程连进去直接用。只记录我自己跑通的关键步骤。"
sidebar:
  order: 4
---

# macOS 上远程跑 OpenCode：Tailscale + SSH + Termux

这套我已经跑通了：**OpenCode 装在 Mac 上，本机常驻；电脑和安卓手机通过 Tailscale 连进来，SSH 上去直接跑 `opencode`。**

我自己的选择：

- Tailscale 用 **Google 账号**登录
- 安卓端用 **Termux**
- Termux 从 **F-Droid** 下载：<https://f-droid.org/packages/com.termux/>
- Tailscale 官网：<https://tailscale.com/>

这篇不讲原理，只记关键步骤。

---

## 1. Mac 端准备

先在 Mac 上装好并登录：

```bash
brew install --cask tailscale-app
open -a Tailscale
```

登录完成后，确认 Tailscale 在线：

```bash
tailscale status
tailscale ip -4
```

然后打开 macOS 自带 SSH：

1. `系统设置 -> 通用 -> 共享 -> 远程登录`
2. 打开 `远程登录`
3. 允许当前用户登录

再确认 SSH 已经监听 22 端口：

```bash
sudo systemsetup -getremotelogin
sudo lsof -nP -iTCP:22 -sTCP:LISTEN
whoami
```

正常的话，你会拿到三样东西：

- `Remote Login: On`
- 当前用户名，比如 `ylq`
- 一个 Tailscale IP，比如 `100.x.x.x`

---

## 2. 电脑端连接

另一台电脑只要也登录了同一个 Tailscale 网络，直接 SSH 到这台 Mac：

```bash
ssh ylq@100.x.x.x
```

连上后直接运行：

```bash
opencode
```

如果你本机已经配好了模型和工具，远端就是直接复用这台 Mac 的环境，不用再重复装一遍。

---

## 3. 安卓手机连接

安卓手机上装两个 App：

- Tailscale
- Termux：<https://f-droid.org/packages/com.termux/>

先让手机上的 Tailscale 登录并保持在线，再打开 Termux，执行：

```bash
pkg update
pkg install openssh
ssh ylq@100.x.x.x
```

输入的是 **Mac 当前用户的登录密码**，不是 Tailscale 的密码。

连上后一样直接运行：

```bash
opencode
```

如果只是临时看代码、改小文件、跑命令，这样已经够用了。

---

## 4. 我踩过的坑

### 手机连不上，`connection refused`

基本就是 Mac 端 SSH 没开。

先看：

```bash
sudo systemsetup -getremotelogin
sudo lsof -nP -iTCP:22 -sTCP:LISTEN
```

### 手机连不上，`end of file`

大概率不是密码错，而是**手机上的 Tailscale 实际不在线**。

在 Mac 上执行：

```bash
tailscale status
```

如果手机设备显示 `offline`，先去手机上把 Tailscale 重新连上。

### `systemsetup -setremotelogin on` 提示没权限

我遇到过：终端没有 `Full Disk Access`，命令开不了 SSH。

最省事的做法不是继续折腾命令，而是直接去：

`系统设置 -> 通用 -> 共享 -> 远程登录`

手动打开。

---

## 5. 最短流程

Mac 上：

```bash
tailscale ip -4
whoami
```

记下 IP 和用户名。

电脑上：

```bash
ssh 用户名@Mac的TailscaleIP
opencode
```

安卓上：

```bash
pkg install openssh
ssh 用户名@Mac的TailscaleIP
opencode
```

这套的优点很直接：**OpenCode 只维护在一台 Mac 上，外面的电脑和手机都只是远程入口。**
