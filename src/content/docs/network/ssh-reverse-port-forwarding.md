---
title: "ssh -R 怎么把内网服务接到公网"
description: "从连接路径讲清 SSH 反向端口转发，并完成回环监听、Caddy HTTPS、断线检测和持续运行配置。"
date: 2026-08-19
lastUpdated: 2026-08-19
verifiedAgainst: "OpenSSH ssh(1)、ssh_config(5)、sshd_config(5) 与 Caddy 官方文档，2026-08-19"
sidebar:
  order: 6
---

一台电脑在家庭网络或公司内网里运行着 Web 服务，地址是 `127.0.0.1:3000`。它能主动访问互联网，外面的请求却进不来。路由器没有端口映射，公司防火墙也不会为了临时调试放行一个入口。

只要手里还有一台能通过 SSH 登录的公网服务器，下面这条命令就能把服务接出来。

```bash
ssh -NT \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -R 127.0.0.1:18080:127.0.0.1:3000 \
  tunnel@server.example.com
```

命令执行以后，公网服务器会监听 `127.0.0.1:18080`。发往这个端口的连接沿着已有的 SSH 加密通道回到内网机器，再由内网机器连接自己的 `127.0.0.1:3000`。

这就是 `ssh -R` 的基本工作。它创建一个远端监听端口，把收到的连接转交给 SSH 客户端这一侧。

## 一条连接怎样走完整程

```mermaid
flowchart LR
    U["外部访问者"] -->|"HTTPS 443"| C["公网服务器上的 Caddy"]
    C -->|"127.0.0.1:18080"| S["sshd 创建的远端监听端口"]
    S ==>|"已有 SSH 加密通道"| H["内网机器上的 ssh 客户端"]
    H -->|"127.0.0.1:3000"| W["本地 Web 服务"]
```

建立隧道时，内网机器先向公网服务器发起普通 SSH 连接。这是一个向外的连接，家庭 NAT 和多数办公网络通常允许它通过。`sshd` 随后按客户端的请求，在服务器上创建监听端口。后续流量复用已经建立的 SSH 连接，不需要外部主机直接找到内网机器。

`-R` 后面的参数可以按两个位置理解。

```text
远端监听地址:远端监听端口:本地侧目标地址:本地侧目标端口
127.0.0.1 : 18080      : 127.0.0.1   : 3000
```

前一组 `127.0.0.1:18080` 属于公网服务器。后一组 `127.0.0.1:3000` 属于运行 `ssh` 命令的内网机器。同一个回环地址在一条命令里指向两台不同的主机，很多配置错误就出在这里。

OpenSSH 还允许把远端监听端口写成 `0`，由服务器动态分配空闲端口并把结果报告给客户端。固定域名和 Caddy 配置需要稳定端口，所以本文使用 `18080`。

协议内部把建立监听和处理请求分成两步。SSH 客户端先发送名为 `tcpip-forward` 的全局请求，其中带着远端监听地址和端口。服务器接受后才开始监听。每当新连接到来，服务器再打开一个 `forwarded-tcpip` 通道，把来源地址和端口一并交给客户端。多个访问连接会成为同一条 SSH 传输连接里的多个独立通道。

这也解释了一个常见现象。浏览器关闭只会结束对应的转发通道，SSH 主连接和远端监听仍然存在。SSH 主连接断开时，监听端口才会随之消失，所有正在使用的转发连接也会中断。

目标地址也不必属于内网机器自身。例如下面的命令会让 SSH 客户端去连接它能访问的数据库主机 `db.internal:5432`。

```bash
ssh -NT -R 127.0.0.1:15432:db.internal:5432 tunnel@server.example.com
```

`db.internal` 的解析和 TCP 连接都发生在 SSH 客户端一侧。因此 `-R` 可以转发同一内网中的其他主机，权限边界也随之扩大。公网服务器上的账号一旦能使用这个端口，就获得了一条通向该数据库的路径。

## `-L`、`-R` 和 `-D` 放在一起看

三种转发的差别主要落在监听端和最终连接端。

| 参数 | 监听发生在哪里 | 最终连接从哪里发起 | 常见用途 |
| --- | --- | --- | --- |
| `-L` | SSH 客户端一侧 | SSH 服务器一侧 | 从本机访问远端内网服务 |
| `-R` | SSH 服务器一侧 | SSH 客户端一侧 | 把本地或内网服务接到远端 |
| `-D` | SSH 客户端一侧 | SSH 服务器一侧 | 在本机提供 SOCKS 代理 |

记命令字母很容易忘，先找监听端会更稳。需要让公网服务器多出一个入口时，监听发生在远端，对应 `-R`。

## 从本地服务走到 HTTPS 域名

先在内网机器启动一个只监听回环地址的测试服务。

```bash
python3 -m http.server 3000 --bind 127.0.0.1
```

另开终端确认本地服务可用。

```bash
curl http://127.0.0.1:3000
```

随后执行开头的 `ssh -NT -R ...` 命令。`-N` 表示不在远端执行命令，当前连接只负责转发。`-T` 禁止分配伪终端。隧道建立后，在公网服务器上验证监听端口。

```bash
curl http://127.0.0.1:18080
ss -lnt | grep 18080
```

两次 `curl` 应该看到同一份页面。到这里，反向端口转发已经成立，但端口只对公网服务器本机开放。

在公网服务器的 Caddyfile 中加入下面的配置。这里假设域名 `app.example.com` 已经解析到服务器，公网防火墙也允许 80 和 443 端口。

```text
app.example.com {
    reverse_proxy 127.0.0.1:18080
}
```

检查配置并重新加载 Caddy。

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl -I https://app.example.com
```

Caddy 知道域名且公网入口满足条件时，会自动申请并续期受信任的 HTTPS 证书。SSH 监听端口仍留在回环地址，TLS、域名路由和访问日志都由 Caddy 处理。

如果 Caddy 运行在容器里，容器的 `127.0.0.1` 指向容器自身，无法直接访问宿主机上的 `18080`。这时需要使用宿主机网络、明确的宿主机地址或 Unix socket。本文的配置假设 Caddy 和 `sshd` 都直接运行在公网服务器上。

## 加密覆盖到哪里

这条路径包含几段不同的连接。访问者到 Caddy 由 HTTPS 保护，Caddy 到 `127.0.0.1:18080` 留在公网服务器内部。公网服务器和内网机器之间的转发数据进入 SSH 加密通道。SSH 客户端离开通道后，再连接参数末尾指定的目标。

目标是本机的 `127.0.0.1:3000` 时，最后一段也只在本机内部流动。目标换成 `db.internal:5432` 后，SSH 客户端到数据库之间会经过内网，这一段不受 SSH 隧道保护。数据库若要求链路加密，仍要单独启用数据库 TLS。`ssh -R` 保护的是两个 SSH 端点之间的数据，不能替目标协议补上认证和加密。

## 为什么不直接监听公网地址

远端转发默认只绑定回环地址。服务端的 `GatewayPorts` 控制客户端能否请求非回环监听地址。

| `GatewayPorts` 值 | 行为 |
| --- | --- |
| `no` | 强制远端转发只在回环地址监听，也是默认值 |
| `yes` | 强制远端转发监听通配地址 |
| `clientspecified` | 允许客户端指定监听地址 |

当服务端使用 `GatewayPorts clientspecified` 时，客户端可以请求下面的监听。

```bash
ssh -NT -R 0.0.0.0:18080:127.0.0.1:3000 tunnel@server.example.com
```

这样会让 `18080` 直接面对公网，云安全组和主机防火墙放行后，任何能到达服务器的人都可以尝试连接。一个临时开发服务往往没有 TLS、认证和限流。回环监听加反向代理更容易控制公开范围，也能把应用端口留在主机内部。

## 把临时命令变成稳定配置

长期使用时，可以把参数放进内网机器的 `~/.ssh/config`。

```text
Host reverse-web
    HostName server.example.com
    User tunnel
    IdentityFile ~/.ssh/id_ed25519_reverse_web
    IdentitiesOnly yes
    RemoteForward 127.0.0.1:18080 127.0.0.1:3000
    ExitOnForwardFailure yes
    ServerAliveInterval 30
    ServerAliveCountMax 3
    SessionType none
    RequestTTY no
```

以后只需运行下面的前台进程。

```bash
ssh reverse-web
```

`ExitOnForwardFailure yes` 会在远端端口占用、服务端禁止转发等情况下让 SSH 立即退出。它只检查转发能否建立。如果本地 Web 服务后来停止，SSH 连接仍然可能保持正常，访问者会收到 Caddy 的 502 响应。

`ServerAliveInterval 30` 会在连接空闲时通过加密通道探测服务器。连续三次没有响应后，SSH 大约在 90 秒内退出。退出只是把失效连接清理掉，自动恢复还需要进程管理器重新启动它。

Linux 可以把 `ssh reverse-web` 交给 systemd，macOS 可以交给 launchd。进程管理器应直接管理前台 SSH 进程，并设置失败后重启。不要同时使用 `ssh -f` 把进程藏到后台，否则管理器很难准确判断隧道是否还活着。最终监控应访问 `https://app.example.com`，因为进程存在只能证明 SSH 还在运行，不能证明本地应用可用。

Linux 用户服务可以从下面这个最小单元开始。`ExecStart` 中的 SSH 路径应以 `command -v ssh` 的结果为准。

```ini
[Unit]
Description=Reverse SSH tunnel for local web
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/bin/ssh reverse-web
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

把它保存为 `~/.config/systemd/user/ssh-reverse-web.service`，随后启用并查看日志。

```bash
systemctl --user daemon-reload
systemctl --user enable --now ssh-reverse-web.service
systemctl --user status ssh-reverse-web.service
journalctl --user-unit ssh-reverse-web.service -f
```

用户注销后是否继续运行取决于发行版的用户服务策略。需要无人值守运行时，应配置 user lingering 或改成系统服务，并继续使用权限受限的普通账号运行 SSH 客户端。

公网服务器也应该限制专用账号能做什么。下面的 `sshd_config` 片段只允许该账号建立远端 TCP 转发，并把监听范围固定在一个回环端口。

```text
Match User tunnel
    AllowTcpForwarding remote
    GatewayPorts no
    PermitListen 127.0.0.1:18080
    X11Forwarding no
    AllowAgentForwarding no
    PermitTTY no
```

修改后先运行 `sshd -t` 检查配置，再重新加载 `sshd`。生产环境还应使用独立密钥，保护私钥权限，并按公网服务器发行版的方式限制账号登录能力。

## 出问题时沿着连接路径检查

排错时从离本地应用最近的位置开始，逐段确认可见结果。

| 现象 | 优先检查 |
| --- | --- |
| 本地 `curl` 已失败 | 应用进程、监听地址和本地端口 |
| SSH 报 `remote port forwarding failed` | 远端端口占用、`AllowTcpForwarding`、`PermitListen` 和 `GatewayPorts` |
| 公网服务器访问 `18080` 失败 | SSH 进程、远端监听状态和本地目标地址 |
| 服务器访问成功，域名访问失败 | Caddy 配置、DNS、80 和 443 端口 |
| 隧道偶尔长时间失效 | 网络切换、机器休眠、保活参数和重启策略 |

客户端运行 `ssh -vvv reverse-web` 可以看到转发请求是否被服务器接受。公网服务器运行 `ss -lntp` 可以确认 `18080` 由谁监听。两项都正常时，再看 Caddy 日志和公开域名，避免一开始就在 DNS、证书和 SSH 之间来回猜。

## 同一套原理还能用在哪里

远程维护内网机器时，可以把本机 SSH 服务转到公网服务器的回环端口。

```bash
ssh -NT -R 127.0.0.1:22022:127.0.0.1:22 tunnel@server.example.com
```

管理员先登录公网服务器，再从服务器连接这个端口。

```bash
ssh -p 22022 localuser@127.0.0.1
```

调试 Webhook 时，主实验中的 HTTPS 域名可以直接指向本地开发服务。第三方平台把回调发给 Caddy，Caddy 经 SSH 隧道交给本地程序。开发服务仍要验证签名，并避免暴露带管理能力的调试接口。

`ssh -R` 适合临时联调、受控远程维护和低流量服务。它依赖一条长期 SSH 连接，内网机器休眠、网络切换或本地进程退出都会中断服务。需要多实例、稳定带宽和完整流量治理时，应把应用正式部署到公网环境，或使用专门的隧道和组网系统。

## 官方资料

- [OpenSSH ssh 命令手册](https://man.openbsd.org/ssh)
- [OpenSSH 客户端配置手册](https://man.openbsd.org/ssh_config)
- [OpenSSH 服务端配置手册](https://man.openbsd.org/sshd_config)
- [IETF SSH 连接协议 RFC 4254](https://datatracker.ietf.org/doc/html/rfc4254#section-7)
- [Caddy 反向代理快速入门](https://caddyserver.com/docs/quick-starts/reverse-proxy)
- [Caddy reverse_proxy 指令](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
