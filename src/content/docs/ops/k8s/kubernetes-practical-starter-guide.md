---
title: "Kubernetes 入门手册：从对象模型到一次可验证的部署"
description: "用一个最小 Web 应用串起 Kubernetes 架构、YAML、Deployment、Service、ConfigMap、Secret、探针、资源限制和排障命令。"
date: 2026-07-31
lastUpdated: 2026-07-31
verifiedAgainst: "Kubernetes 官方文档，2026-07-31"
sidebar:
  order: 1
---

Kubernetes 的概念很多，但入门时只需要先建立一条主线：

```text
你提交期望状态
  → API Server 保存对象
  → Controller 发现实际状态不一致
  → Scheduler 选择节点
  → Kubelet 启动 Pod
  → Service 为 Pod 提供稳定访问入口
```

## 集群由什么组成

一个集群由控制平面和工作节点组成。

### 控制平面

| 组件 | 职责 |
|---|---|
| `kube-apiserver` | Kubernetes API 入口，所有对象操作都经过它 |
| `etcd` | 保存集群状态 |
| `kube-scheduler` | 为尚未分配节点的 Pod 选择 Node |
| `kube-controller-manager` | 运行控制器，持续把实际状态拉回期望状态 |

### 工作节点

| 组件 | 职责 |
|---|---|
| `kubelet` | 确保分配到本节点的 Pod 正常运行 |
| 容器运行时 | 拉取镜像并运行容器 |
| `kube-proxy` 或等价实现 | 支撑 Service 网络转发 |

官方架构说明见 [Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/)。

## 对象模型：spec 和 status

Kubernetes 对象是“期望状态的记录”：

- `spec`：你希望系统变成什么样；
- `status`：系统当前实际上是什么样；
- Controller：持续比较两者并执行修正。

一个对象通常包含四个必填部分：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-api
spec:
  # 不同 kind 在这里有不同字段
```

不要手写 `status`、`uid`、`resourceVersion`、`managedFields` 等由系统维护的字段。对象模型详见 [Objects in Kubernetes](https://kubernetes.io/docs/concepts/overview/working-with-objects/)。

## 部署一个最小应用

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: demo
```

Namespace 用来隔离一组资源，不是安全边界的全部。生产环境还需要配合 RBAC、NetworkPolicy 和 ResourceQuota。

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-api
  namespace: demo
  labels:
    app: demo-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: demo-api
  template:
    metadata:
      labels:
        app: demo-api
    spec:
      containers:
        - name: api
          image: nginx:1.27-alpine
          ports:
            - name: http
              containerPort: 80
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 500m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 2
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
```

`selector.matchLabels` 必须和 Pod 模板的 labels 对得上。Deployment 管理 ReplicaSet，ReplicaSet 再维护 Pod 数量。

### Service

Pod 会重建，IP 也会变化。Service 用标签选择一组 Pod，提供稳定的虚拟地址：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-api
  namespace: demo
spec:
  selector:
    app: demo-api
  ports:
    - name: http
      port: 80
      targetPort: http
  type: ClusterIP
```

同一 Namespace 内可以通过 `http://demo-api` 访问；跨 Namespace 可以使用 `demo-api.demo.svc.cluster.local`。

## 配置和 Secret

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: demo-api-config
  namespace: demo
data:
  LOG_LEVEL: info
```

### 应用 Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: demo-api-secret
  namespace: demo
type: Opaque
stringData:
  API_TOKEN: replace-me
```

在 Deployment 中引用：

```yaml
envFrom:
  - configMapRef:
      name: demo-api-config
  - secretRef:
      name: demo-api-secret
```

Secret 的 Base64 只是编码，不是加密。不要把生产凭证明文提交到 Git；应使用云厂商 Secret Manager、External Secrets 或密钥加密方案。

## 私有镜像 imagePullSecrets

创建镜像仓库凭证：

```bash
kubectl -n demo create secret docker-registry registry-credentials \
  --docker-server=registry.example.com \
  --docker-username="$REGISTRY_USERNAME" \
  --docker-password="$REGISTRY_PASSWORD"
```

在 Pod 模板中引用：

```yaml
spec:
  imagePullSecrets:
    - name: registry-credentials
  containers:
    - name: api
      image: registry.example.com/team/demo-api:1.0.0
```

凭证 Secret 和使用它的 Pod 必须位于同一个 Namespace。

## 为什么 requests、limits 和探针不能省

### requests

Scheduler 使用 requests 判断节点是否容得下 Pod。没有 requests，调度和容量规划都会失真。

### limits

- CPU limit 会产生节流；
- 超出 memory limit 通常会触发 OOMKill；
- limit 不是性能目标，只是资源上界。

### readinessProbe

readiness 失败时，Pod 暂时从 Service 端点中移除，但容器不一定重启。

### livenessProbe

liveness 失败会触发容器重启。不要把依赖服务偶发不可用直接当成 liveness 失败，否则容易形成重启风暴。

如果应用启动很慢，再增加 `startupProbe`，避免 liveness 过早介入。

## 应用和验证

假设三个对象保存在 `k8s/`：

```bash
kubectl apply -f k8s/
kubectl -n demo rollout status deployment/demo-api
kubectl -n demo get deployment,pod,service
kubectl -n demo port-forward service/demo-api 8080:80
curl -i http://127.0.0.1:8080/
```

一次完整验证至少包括：

1. Deployment rollout 成功；
2. 期望数量的 Pod Ready；
3. Service 有 Endpoints；
4. 真实请求返回预期结果。

`kubectl apply` 成功只证明 API 接受了对象，不证明应用可用。

## 常用排障路径

### Pod 一直 Pending

```bash
kubectl -n demo describe pod <pod-name>
kubectl get events -A --sort-by=.lastTimestamp
```

重点看资源不足、节点选择器、污点和 PVC。

### ImagePullBackOff

```bash
kubectl -n demo describe pod <pod-name>
kubectl -n demo get secret registry-credentials
```

检查镜像名称、tag、Secret 名称、Namespace 和仓库权限。

### CrashLoopBackOff

```bash
kubectl -n demo logs <pod-name> --previous
kubectl -n demo describe pod <pod-name>
```

`--previous` 用来读取上一个已崩溃容器的日志。

### Service 访问不到

```bash
kubectl -n demo get service demo-api
kubectl -n demo get endpointslice -l kubernetes.io/service-name=demo-api
kubectl -n demo get pod -l app=demo-api --show-labels
```

优先确认 Service selector 是否选中了 Ready Pod。

## 生产前检查

- 镜像使用不可变 tag 或 digest；
- 配置与凭证分离；
- requests、limits 和探针齐全；
- 至少配置 PodDisruptionBudget 或明确可接受的中断策略；
- 使用滚动发布并验证回滚；
- 权限遵循最小化原则；
- 日志、指标和事件可以被采集；
- 数据卷、备份和恢复方案经过验证；
- 不依赖手工修改线上对象；
- manifest 能通过 CI 校验和测试。

Kubernetes 的核心不是记字段，而是理解控制循环：**声明期望状态，观察实际状态，用可重复的配置让系统自动收敛。**
