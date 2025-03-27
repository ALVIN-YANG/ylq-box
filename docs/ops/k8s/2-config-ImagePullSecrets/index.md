---
id: k8s-imagePullSecrets
title: 配置 imagePullSecrets 拉取私有库镜像
description: 配置 imagePullSecrets 拉取私有库镜像
keywords:
  - k8s
---

- imagePullSecrets 是 Kubernetes 中的一个字段，用于指定 Pod 或 Deployment 如何使用私有镜像仓库的凭证来拉取镜像。
- imagePullSecrets 指定一个或多个 Secret 名称，这些 Secret 包含了拉取镜像所需的凭证。

## 创建 Secrets

```
kubectl create secret docker-registry <secret-name> \
  --docker-server=<镜像仓server-host> \
  --docker-username=<your-username> \
  --docker-password=<your-password>
```

## 使用

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: <镜像仓server-host>/my-repo/my-image:latest
      imagePullSecrets:
      - name: <secret-name>
```
