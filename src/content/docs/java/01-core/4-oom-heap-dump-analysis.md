---
title: "OOM 内存泄漏：从 Heap Dump 到代码溯源的实战"
description: "遇到 java.lang.OutOfMemoryError 怎么办？重启只能续命，唯有 Dump 分析才能根治。本文教你如何抓取案发现场，并使用 MAT 工具揪出内存泄漏的内鬼。"
sidebar:
  order: 4
---

# OOM 内存泄漏：从 Heap Dump 到代码溯源的实战

比起 CPU 100%，Java 程序员更害怕看到日志里出现那个阴森森的词：`java.lang.OutOfMemoryError: Java heap space`。

一旦 OOM 发生，系统往往已经进入不可用状态，各种诡异的请求超时和数据丢失随之而来。对于大部分新手而言，遇到 OOM 的第一反应是修改启动参数把堆内存调大（比如从 `-Xmx2G` 调成 `-Xmx4G`）。

但如果是**内存泄漏（Memory Leak）**，无论你给多少内存，最终都会被吃干抹净。唯一的彻底解决方式，是对案发现场的内存快照（Heap Dump）进行法医级别的尸检。

## 第一步：保护案发现场（极其重要）

OOM 往往发生在深夜或者无人值守的流量高峰期。等第二天你上班看到监控，进程早就挂了或者被 K8s 探针重启了。你去哪找内存快照？

**铁律：生产环境所有的 Java 应用启动参数中，必须包含以下两行：**

```bash
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/java/oom_dump.hprof
```

这两行参数相当于飞机的黑匣子。一旦触发 OOM，JVM 会在咽气前最后一秒，把当时内存里所有的对象清清楚楚地写到 `oom_dump.hprof` 文件中。

如果你是在排查一个还活着的、但内存持续走高的进程，也可以通过 `jmap` 或 Arthas 手动导出：
```bash
jmap -dump:format=b,file=heap.hprof <PID>
```
*(注意：手动 dump 时会触发 Full GC，甚至导致系统明显停顿数秒，请谨慎在早高峰操作)*

## 第二步：使用 MAT 打开黑匣子

拿到几 GB 甚至十几 GB 的 `.hprof` 文件后，不要用普通的编辑器打开。我们需要使用专业的内存分析工具，目前最强大免费工具依然是 Eclipse 开发的 **MAT (Memory Analyzer Tool)**。

*(如果你有预算，JProfiler 或 IDEA 内置的 Profiler 体验会更好)*

### 1. 看漏斗图 (Overview)
用 MAT 打开 Dump 文件后，第一眼看到的是一个大饼图。如果饼图里有一个区域占据了 80% 以上的空间，那不用怀疑，这个对象就是内鬼。

### 2. 核心概念：Dominator Tree（支配树）
不要去看直方图（Histogram）里密密麻麻的 `String` 和 `char[]`。内存泄漏往往是你的业务对象持有了这些底层对象导致的。

点击面板上的 **Dominator Tree**。这个视图的神奇之处在于：它会列出**如果你把某个大对象删掉，系统能立刻腾出多少空间（Retained Heap）**。

### 3. 找引用链 (Path to GC Roots)
你在支配树里看到，有一个叫 `com.company.export.ExportTask` 的对象占了 2GB 内存。但这还不够，你得知道是谁不肯撒手，导致垃圾回收器（GC）不敢回收它。

右键点击这个对象 -> 选择 `Path To GC Roots` -> 选择 `exclude all phantom/weak/soft etc. references`（排除弱引用等）。

这时候 MAT 会给你拉出一条线：
```text
ArrayList <--- 持有 --- Static Map <--- 持有 --- ReportManager
```
真相大白：开发人员为了做缓存，在一个单例的 `ReportManager` 里写了一个静态的 `HashMap`，不停地往里面塞导出的任务对象，并且**从来不清理**！这就是最典型的 Java 内存泄漏。

## 第三步：避坑 2026 年常见的高级内存泄漏场景

除了愚蠢的静态集合不清理，在现代的高并发应用中，我们常常遇到以下隐蔽的泄漏：

### 1. 拦截器 / ThreadLocal 泄漏
如果你在过滤器（Filter）的 `doFilter` 前把用户的 Session 放进了 `ThreadLocal`，但忘记在 `finally` 块中调用 `remove()`。
在 Tomcat 的线程池模型下，这个线程会被复用，不仅会导致下一个请求读到上一个用户的数据（越权漏洞），这个巨无霸 Session 对象也会被一直卡在内存里无法回收。

### 2. Unclosed 资源导致底层泄漏
在操作 Excel 导出（如 EasyExcel/POI）、读取大文件、或者操作压缩流时，如果不使用 `try-with-resources`，底层的资源句柄和相关堆外缓冲区（Direct Memory）将无法被回收，甚至可能把系统的堆外内存撑爆，引发 `java.lang.OutOfMemoryError: Direct buffer memory`。

### 3. 危险的 `findAll` 无分页查询
如果有人在管理后台写了一个 `SELECT * FROM user_log`（百万级数据），MyBatis 或 JPA 会直接把这上百万条记录转换为 Java Entity 对象塞进内存。一瞬间 4GB 内存被打满。
**建议：**在架构层面禁止任何未加 `limit` 限制的全表扫描，对于海量导出，强制使用游标流式读取（Cursor Fetch）。

## 总结

排查 OOM 就像破案。
`-XX:+HeapDumpOnOutOfMemoryError` 帮你拉起警戒线，MAT 里的支配树帮你锁定嫌疑人，GC Roots 引用链最终定罪。

永远不要通过盲目增加内存来解决泄漏问题，那不过是延长了下一次崩溃到来的时间罢了。
