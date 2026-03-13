---
title: "现代 Java 并发：抛弃 synchronized 后的锁选择"
description: "在 2026 年的高并发架构下，重量级的 synchronized 已经不再是首选。本文带你梳理 ReentrantLock、读写锁、StampedLock 以及分布式锁的使用场景。"
sidebar:
  order: 5
---

# 现代 Java 并发：抛弃 synchronized 后的锁选择

回想十年前，只要提到“线程安全”，很多人的第一反应就是在方法上加个 `synchronized`。

但到了 2026 年，随着虚拟线程的普及（参考本专栏第一篇关于 Pinning 的警告），以及多核 CPU 算力的压榨，`synchronized` 因为其粗粒度和早期设计的一些历史包袱，越来越被现代高并发框架所嫌弃。

今天，我们梳理一套现代 Java 开发中“并发控制”的最佳实践和武器库。

## 1. 替代 synchronized 的标准主力：ReentrantLock

`ReentrantLock`（可重入锁）是 `java.util.concurrent` 包里的老大哥，但在现代架构中它承担了最重要的防线。

### 为什么它比 synchronized 更好？
1. **支持公平锁**：`new ReentrantLock(true)` 可以保证等待最久的线程最先拿到锁，避免某些线程被“饿死”。
2. **尝试获取锁与超时**：`tryLock(5, TimeUnit.SECONDS)`。如果 5 秒拿不到锁，业务可以直接返回“系统繁忙”给前端，而不是像 `synchronized` 那样让线程陷入无尽的死等（甚至导致系统雪崩）。
3. **完美适配虚拟线程**：它不会引发底层操作系统线程的 Pinning 现象。

**标准模板：**
```java
Lock lock = new ReentrantLock();
// 注意：千万不要把 lock() 写在 try 块里面
lock.lock(); 
try {
    // 保护临界区资源
    inventory.decrement();
} finally {
    // 确保任何异常发生都能释放锁
    lock.unlock();
}
```

## 2. 读多写少的核武器：StampedLock

在缓存或者字典表加载的场景中，99% 的请求都是在**读取**数据，只有 1% 的请求在更新数据。如果用 `ReentrantLock`，所有的读操作也会被互斥排队，极其影响 QPS。

以前大家喜欢用 `ReentrantReadWriteLock`（读写锁），但它有个缺陷：如果一直有源源不断的读请求，写线程可能会被彻底“饿死”拿不到锁。

JDK 8 引入、并在后续版本不断优化的 **StampedLock（邮戳锁）** 才是读多写少场景下的真神。

它引入了**“乐观读（Optimistic Read）”**的概念：读取数据时不加任何悲观锁，只是拿一个“邮戳（版本号）”。读完数据后，校验一下邮戳在这期间有没有被写线程改过。如果没有被改，说明读到的数据是安全的，极大提升了吞吐。

```java
public class Point {
    private double x, y;
    private final StampedLock sl = new StampedLock();

    // 只读方法
    public double distanceFromOrigin() {
        // 1. 获取乐观读邮戳（极其轻量）
        long stamp = sl.tryOptimisticRead();
        double currentX = x, currentY = y;
        
        // 2. 检查在此期间是否有其他线程执行了写入
        if (!sl.validate(stamp)) {
            // 如果校验失败，说明数据脏了，升级为悲观读锁重新获取
            stamp = sl.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }
        return Math.hypot(currentX, currentY);
    }
}
```

## 3. 分布式时代的必然：超越单机的分布式锁

必须要清醒地认识到：不管是 `ReentrantLock` 还是 `StampedLock`，它们都是**单机级别的（JVM 级别的内存锁）**。

在 2026 年的微服务架构中，你的订单服务起码部署了 3 个以上的容器节点。如果用户疯狂点击“退款”按钮，请求落到了节点 A 和节点 B 上。你哪怕把 JVM 的锁写出一朵花来，节点 A 和节点 B 还是会同时退款两次。

这就要求跨越 JVM 内存，把锁放到大家都能看到的公共存储里去。

### 主流方案：Redis + Redisson
抛弃自己手写 `setnx` 和 `expire` 的烂摊子。用 Redisson 的看门狗机制（Watchdog）才是业界标准。

```java
@Autowired
private RedissonClient redisson;

public void refund(String orderId) {
    RLock lock = redisson.getLock("refund_lock:" + orderId);
    
    // 尝试获取锁，最多等3秒。获取到后，如果没有手动释放，底层看门狗会自动续期。
    boolean isLocked = false;
    try {
        isLocked = lock.tryLock(3, -1, TimeUnit.SECONDS);
        if (isLocked) {
            // 执行退款逻辑
        } else {
            throw new BusinessException("系统正在处理中，请勿重复点击");
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    } finally {
        if (isLocked && lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }
}
```

## 总结

2026 年的并发编程，早就不是抱着一本《Java并发编程实战》死磕 `wait/notify` 的时代了。

- 保护内部复杂逻辑、规避虚拟线程死锁，用 `ReentrantLock`。
- 做高并发的本地缓存组件，上 `StampedLock`。
- 只要涉及业务防重刷、集群状态同步，无脑祭出中间件 `Redisson`。

选对锁，你的系统就稳了一半。
接下来，我们将视线从底层的并发转移到上层的开发框架：Spring Boot 与 Spring Data。在微服务架构里，框架层又有那些最新的避坑实践呢？请看下一篇章。
