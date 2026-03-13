---
title: Java 多线程与并发指南 (包含虚拟线程)
description: 从传统平台线程到 Java 21 引入的虚拟线程 (Virtual Threads)，全面掌握现代 Java 高并发编程
sidebar:
  label: 多线程与虚拟线程
---

Java 提供了强大的多线程支持。在 2026 年的现代 Java 开发中，除了传统的平台线程（Platform Threads）与线程池，基于 Project Loom 引入的 **虚拟线程 (Virtual Threads)** 已经成为了构建高并发应用的首选。

## 传统平台线程的创建与启动

传统线程在操作系统级别会映射为一个原生线程，具有较高的创建开销。

1. **实现 `Runnable` 接口**：
   ```java
   public class Main {
       public static void main(String[] args) {
           Thread thread = new Thread(() -> {
               System.out.println("平台线程运行中...");
           });
           thread.start();
       }
   }
   ```

## 革命性的虚拟线程 (Java 21+)

虚拟线程是轻量级的线程，由 JVM 进行调度，不直接绑定到操作系统的原生线程。这使得我们在单机上可以轻松创建数以百万计的线程，而不会耗尽内存或导致上下文切换的性能灾难。

### 1. 创建虚拟线程

```java
public class VirtualThreadDemo {
    public static void main(String[] args) throws InterruptedException {
        // 使用 Thread.ofVirtual() 创建并启动
        Thread vThread = Thread.ofVirtual().start(() -> {
            System.out.println("虚拟线程执行中: " + Thread.currentThread());
        });
        
        vThread.join();
    }
}
```

### 2. 使用虚拟线程池 (结构化并发)

在现代 Java 中，通常推荐使用 `Executors.newVirtualThreadPerTaskExecutor()`，它会为每个任务启动一个全新的虚拟线程，无需像过去那样使用复杂的池化技术。

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        final int taskId = i;
        executor.submit(() -> {
            // 模拟阻塞 I/O，虚拟线程在阻塞时会主动让出底层平台线程
            Thread.sleep(1000); 
            System.out.println("完成任务 " + taskId);
            return taskId;
        });
    }
} // try-with-resources 会自动等待所有虚拟线程执行完毕
```

## 线程同步与锁机制

无论是平台线程还是虚拟线程，访问共享资源时都需要同步。

1. **`synchronized` 关键字**：
   ```java
   class Counter {
       private int count = 0;
       public synchronized void increment() { count++; }
   }
   ```
   *注意：在早期的 Java 版本中，虚拟线程在 `synchronized` 块内进行 I/O 阻塞会导致底层平台线程被 "Pinning" (固定)，但在 Java 25 左右该问题已被彻底优化。*

2. **`ReentrantLock`**：
   提供了比 `synchronized` 更灵活的锁机制。

## 总结

在 2026 年，Java 并发编程的范式已经发生了彻底的转变：
- 对于 **CPU 密集型**任务，继续使用传统的 `ForkJoinPool` 或固定大小的线程池。
- 对于 **I/O 密集型**任务（如数据库查询、网络请求），无脑使用 **虚拟线程 (Virtual Threads)**，彻底告别复杂的回调地狱和响应式编程（如 WebFlux）。
