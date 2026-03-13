---
title: "微服务无损发布：Spring Boot 优雅停机与 K8s 探针联动"
description: "每次发版部署，接口总是会报几百个 502 网关错误？本文讲解如何在 2026 年的容器化架构中配置 Spring Boot 的优雅停机，结合 K8s 实现真正的平滑无损发布。"
sidebar:
  order: 5
---

# 微服务无损发布：Spring Boot 优雅停机与 K8s 探针联动

“为什么每次我们在晚上 10 点更新发版，监控大屏上总会弹出一波 502 Bad Gateway 和 500 接口超时的报错？”

这是无数运维和开发在复盘会上经常争吵的问题。
很多公司习惯于直接使用 `kill -9` 杀掉旧的 Java 进程，或者直接在 Kubernetes 里执行滚动更新（Rolling Update）。

这种简单粗暴的下线方式会导致两场灾难：
1. **处理到一半的请求被生生掐断**：用户正在支付扣款，走到一半进程被杀了，导致资金状态不一致。
2. **流量还在源源不断地打进来**：网关（如 Nginx/Ingress）还没意识到这个节点要下线，依然把新用户的请求往这台已经开始关机的服务器上送。

在 2026 年的高可用架构标准中，我们决不允许应用在发布时产生任何有感知的报错。这就要求我们必须实现**无损发布（优雅停机，Graceful Shutdown）**。

## 1. 什么是优雅停机？

优雅停机的核心逻辑是：**“挂上免战牌，把手里的活干完，然后再体面地离开。”**

当应用收到关闭信号（通常是 K8s 发出的 `SIGTERM` 信号）时：
1. 底层的 Tomcat/Undertow web 容器立即**拒绝接收任何新的网络连接**。
2. 告诉网关或注册中心：“我准备下线了，别给我派单了。”
3. 给当前正在处理的那些 HTTP 请求一个**宽限期（Grace Period）**，比如 30 秒，让它们有充足的时间执行完数据库操作并返回响应。
4. 宽限期结束后，无论有没有处理完，强制关闭连接并退出 JVM。

## 2. Spring Boot 侧的配置

在 Spring Boot 2.3+ 以及后续的 3.x 版本中，官方已经原生内置了这套机制，你只需要在 `application.yml` 里开启它：

```yaml
server:
  # 将停机模式从默认的 IMMEDIATE 切换为 GRACEFUL
  shutdown: graceful

spring:
  lifecycle:
    # 设定给正在处理的请求多少宽限期，默认是 30s。根据你系统最慢的接口来评估。
    timeout-per-shutdown-phase: 30s
```

就这么简单。只要你在 Linux 中用 `kill -15 <PID>`（千万不要用 `kill -9`）通知进程，Spring Boot 控制台就会优雅地打印出：
`Commencing graceful shutdown. Waiting for active requests to complete...`

## 3. Kubernetes 架构下的终极盲区

如果你以为加了上面的配置，部署到 K8s 里就能万事大吉，那你大概率还是要背锅的。

**K8s 的路由刷新是异步的。**
当 K8s 决定停掉一个 Pod 时，它会**同时**做两件事：
1. 发送 `SIGTERM` 给你的 Spring Boot 容器。
2. 通知 K8s 网络组件（kube-proxy / Ingress）从可用 Endpoint 列表里摘除这个 Pod。

但网络组件更新 iptables 或 Nginx 配置是需要时间的（可能有几秒的延迟）！
这就导致：Spring Boot 收到 `SIGTERM` 已经开启了优雅停机，**不再接收新请求了**。但 K8s 的网关因为还没更新完路由，依然把外面的流量往这个 Pod 里送。这些流量就会被 Tomcat 瞬间拒之门外，抛出 `Connection Refused`（502 错误）。

### 终极解法：K8s PreStop Hook 拖延战术

为了解决这个异步时间差，我们需要在 K8s 层面用一个小技巧：给 Pod 加上一个 **PreStop Hook**。
告诉 K8s：在你要杀我之前，先执行一个 sleep 命令等一会，让子弹飞一会，等网关把你把我摘除的消息广播到全网了，你再发 `SIGTERM` 给 Spring Boot。

**修改你的 Deployment.yaml 配置：**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  template:
    spec:
      containers:
      - name: user-service
        image: company/user-service:1.0.0
        lifecycle:
          preStop:
            exec:
              # 重点：收到摘除命令后，死皮赖脸硬拖 10 秒钟
              # 这 10 秒钟内，微服务依然正常处理请求，同时 K8s 网关正在全网下线你的 IP
              command: ["/bin/sh", "-c", "sleep 10"]
```

## 4. 就绪探针与活性探针 (Readiness & Liveness)

除了优雅停机，要做到平滑的启动（无损上线），你必须配置 K8s 探针。
Spring Boot Actuator 原生提供了针对 K8s 容器的探测接口：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

开启 K8s 探针感知：
```yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
```

在 K8s yaml 中配置：
```yaml
        readinessProbe:
          # K8s 会不断访问这个接口，只有返回 200 OK，K8s 网关才会把真实流量放进来
          # 这样就避免了 Spring 刚启动一半，流量打进来报错的问题
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          # K8s 会用这个接口检测你的服务是不是死锁或 OOM 假死了，如果挂了就自动重启你
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
```

## 总结

一个成熟的微服务架构，开发不仅要会写 CRUD，还要懂得如何与底层的基础设施打交道。

1. **Spring Boot 侧开启 `server.shutdown=graceful`**，保护正在飞行的请求。
2. **K8s 侧配置 `PreStop sleep`**，掩护网关路由异步刷新的时间差。
3. **配置 Readiness 探针**，拒绝在系统还未完全“暖机”时接收流量。

做到这三点，你的系统就能实现不论何时何地，随时点击“部署发版”，用户体验 0 报错的丝滑无损升级。这就是现代云原生工程师的底气。
