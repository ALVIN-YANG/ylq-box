---
id: k8s-overview
title: k8s 概览与相关索引
description: k8s 概览与相关索引
keywords:
  - k8s
---

## Kubernetes 的作用

- **容器编排**：Kubernetes 提供了高级的容器管理功能，包括容器的部署、扩展、更新和维护。
- **服务发现和负载均衡**：Kubernetes 能够自动分配负载并发现服务。
- **自我修复**：Kubernetes 监控容器的健康状态，自动替换失败的容器实例。
- **水平扩展**：Kubernetes 可以根据实时负载自动扩展容器实例的数量。
- **声明式部署**：用户通过声明期望的状态，Kubernetes 自动将当前状态更改为期望状态。
- **配置管理**：Kubernetes 允许集中管理应用的配置。
- **存储编排**：Kubernetes 支持持久化存储和动态卷挂载。
- **多环境支持**：Kubernetes 支持在不同的环境（开发、测试、生产）中运行相同的应用配置。
- **安全性**：Kubernetes 提供了网络策略、服务账户、角色绑定等安全机制。
- **多租户支持**：Kubernetes 支持多租户部署，允许多个团队或用户共享资源。
- **开发者和运维协作**：Kubernetes 促进了开发和运维团队之间的协作。
- **云原生应用开发**：Kubernetes 推动了云原生应用的开发，支持微服务架构和 CI/CD 流程。
- **生态系统和扩展性**：Kubernetes 拥有丰富的生态系统，支持多种扩展和集成。

## 架构

![](https://img.ilovestudy.club/blog/architecture.jpg)

### 控制 k8s

本质上都是调用 apiServer 的接口，两种使用方式：

- kubectl 命令行
- 图形化界面

#### 开源 Kubernetes 管理平台

| 平台名称     | 官网链接                                               | 应用简介                                                                   |
| ------------ | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| KubeSphere   | [KubeSphere](https://kubesphere.io/)                   | 面向云原生应用的容器混合云，提供多云与多集群统一分发和运维管理。           |
| Rancher      | [Rancher](https://rancher.com/)                        | 支持多个 Kubernetes 集群的管理，提供应用程序管理、监控和自动化部署等功能。 |
| Lens         | [Lens](https://k8slens.dev/)                           | 跨平台 Kubernetes 可视化工具，支持直观界面操作集群资源。                   |
| K9s          | [K9s](https://k9scli.io/)                              | 基于 curses 的终端 UI 管理工具，用于 Kubernetes 集群交互。                 |
| Shipyard     | [Shipyard](https://shipyard-project.io/)               | 基于 Web 的 Docker 管理工具，支持 Kubernetes 集群管理。                    |
| Kubernetic   | [Kubernetic](https://kubernetic.com/)                  | 提供强大功能和直观界面，帮助管理和操作 Kubernetes 集群。                   |
| Grafana      | [Grafana](https://grafana.com/)                        | 主要为监控和可视化工具，支持 Kubernetes 集成。                             |
| Kubevious    | [Kubevious](https://kubevious.io/)                     | 开源 Kubernetes Dashboard，具有集中配置管理和 TimeMachine 功能。           |
| Octant       | [Octant](https://octant.dev/)                          | 开源 K8S 可视化工具，支持自定义插件和扩展。                                |
| Kontena Lens | [Lens](https://kontena.io/lens/)                       | Kubernetes 的智能仪表板，支持多集群管理和实时可视化。                      |
| Kubermatic   | [Kubermatic](https://www.kubermatic.com/)              | 跨云平台 Kubernetes 集群管理工具。                                         |
| Portainer    | [Portainer](https://www.portainer.io/)                 | 开源容器管理工具，支持 Docker 和 Kubernetes 集群管理。                     |
| Weave Scope  | [Weave Scope](https://www.weave.works/oss/scope/)      | 用于监控、可视化和管理 Docker 及 Kubernetes 的工具。                       |
| KubeCube     | [KubeCube](https://github.com/kubecube-io/kubecube)    | 企业级容器平台，提供 Kubernetes 资源可视化管理和多租户管理功能。           |
| KuberLogic   | [KuberLogic](https://github.com/kuberlogic/kuberlogic) | 在 Kubernetes 集群上部署和管理软件的平台。                                 |
| Otomi        | [Otomi](https://otomi.io/)                             | 云无关的基于 Kubernetes 的平台，提供类似桌面的用户界面。                   |

### Master 节点和 Node 节点

- Kubernetes 集群由 Master 节点和 Node 节点组成。
- Master 节点负责管理集群，Node 节点负责运行容器。
- Master 节点也可以做为 Node 节点
- k8s 集群至少一个 Master 和一个 Node 节点。

Master 节点结构图：

- ![](http://img.ilovestudy.club/blog/kubernetes-.png)

Node 节点结构图：

- ![](http://img.ilovestudy.club/blog/kubernetes-node.png)

| 节点            | 组件               | 功能描述                                         |
| --------------- | ------------------ | ------------------------------------------------ | --- |
| **Master 节点** |                    | **负责集群的管理和控制。**                       |
|                 | API Server         | 所有对 k8s 集群的操作都要经过 API Server。       |     |
|                 | Scheduler          | 根据资源需求等规则调度 Pod 到不同的 Node 上。    |
|                 | Controller Manager | 运行集群中各种控制器。                           |
|                 | etcd               | Kubernetes 集群的后端存储。                      |
| **Node 节点**   |                    | **负责运行集群中的工作负载。**                   |
|                 | Kubelet            | 在每个 Node 上运行，负责启动容器等。             |
|                 | Kube-proxy         | 在每个 Node 上运行，负责实现服务发现和负载均衡。 |
|                 | Container Runtime  | 负责容器的生命周期管理。                         |

### Kubernetes 核心资源组件

| 资源名称    | 作用或备注说明                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| Pod         | 运行容器化应用的最小部署单元。一个 pod 中可能有一个或多个容器，例如：一个运行 Web 应用，另一个负责收集日志。 |
| Service     | 东西流量(服务间横向访问),提供对一组 Pod 的访问策略，实现负载均衡和网络服务发现。                             |
| Ingress     | 北向流量(集群外接的纵向访问)的路由网关定义，ingress-nginx 是它控制器的实现之一。                             |
| Volume      | 为 Pod 提供存储卷，支持数据持久化。                                                                          |
| Namespace   | 逻辑分区，用于隔离不同的用户或项目。                                                                         |
| Deployment  | 管理 Pod 和 ReplicaSet 的声明式更新和自我修复。                                                              |
| StatefulSet | 管理有状态应用的 Pod，提供顺序部署、扩展和缩容。                                                             |
| DaemonSet   | 通过标签选择器，在每个匹配的 Node 上自动运行一个 Pod 副本。                                                  |
| CronJob     | 管理定时任务，类似于 UNIX 的 cron 工具。                                                                     |
| ConfigMap   | 存储配置信息，供 Pod 挂载或注入环境变量。                                                                    |
| Secret      | 存储敏感信息，如密码、OAuth 令牌和 SSH 密钥。                                                                |
| ReplicaSet  | 确保指定数量的 Pod 副本始终运行，用于 Pod 的水平扩展和替换。                                                 |
