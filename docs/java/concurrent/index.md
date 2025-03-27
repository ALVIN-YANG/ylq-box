---
id: java-concurrent
title: Java 多线程
description: 多线程。
keywords:
  - java
  - 多线程
---

# Java 多线程

## 引言

在现代软件开发中，多线程编程是一个重要的概念，它允许程序同时执行多个任务，提高程序的性能和响应速度。Java 作为一门广泛使用的编程语言，提供了强大的多线程支持，使得开发者能够充分利用多核处理器的优势。本文将介绍 Java 多线程的基础知识、线程的创建与启动、线程的状态与控制、线程同步与锁机制、以及线程池的使用等内容，帮助读者全面了解 Java 多线程编程的核心要点。

## 线程的基础概念

线程是进程中的一个实体，是被系统独立调度和执行的单位。每个线程拥有自己的运行栈和程序计数器，但共享进程的内存空间和其他资源。Java 中的线程是通过 `java.lang.Thread` 类来表示的，线程的执行代码通常放在 `Runnable` 接口的实现类中。

## 创建与启动线程

在 Java 中，可以通过以下两种方式来创建线程：

1. **继承 `Thread` 类**：
   定义一个类继承 `Thread`，并重写 `run()` 方法，在该方法中编写线程要执行的代码。然后通过创建该类的实例并调用 `start()` 方法来启动线程。

   ```java
   class MyThread extends Thread {
       @Override
       public void run() {
           System.out.println("线程运行中...");
       }
   }

   public class Main {
       public static void main(String[] args) {
           MyThread thread = new MyThread();
           thread.start(); // 启动线程
       }
   }
   ```

2. **实现 `Runnable` 接口**：
   定义一个类实现 `Runnable` 接口，并实现 `run()` 方法。然后创建该类的实例，并将其作为参数传递给 `Thread` 类的构造函数，最后调用 `start()` 方法启动线程。

   ```java
   class MyRunnable implements Runnable {
       @Override
       public void run() {
           System.out.println("线程运行中...");
       }
   }

   public class Main {
       public static void main(String[] args) {
           MyRunnable runnable = new MyRunnable();
           Thread thread = new Thread(runnable);
           thread.start(); // 启动线程
       }
   }
   ```

## 线程的状态与控制

线程在其生命周期中会经历多种状态，包括新建（New）、就绪（Runnable）、运行（Running）、阻塞（Blocked）、等待（Waiting）、计时等待（Timed Waiting）和终止（Terminated）。可以通过 `Thread` 类提供的方法来控制线程的状态，例如：

- `start()`：启动线程，使其进入就绪状态。
- `run()`：线程执行的入口方法，通常由 `start()` 方法内部调用。
- `sleep(long millis)`：让当前线程暂停执行指定的时间，进入计时等待状态。
- `join()`：等待该线程终止，当前线程进入阻塞状态，直到目标线程完成。
- `yield()`：暂停当前线程的执行，让出 CPU 资源，使其他具有相同优先级的线程获得执行机会。
- `interrupt()`：中断线程，给线程发送一个中断信号，线程可以根据需要处理该信号。

## 线程同步与锁机制

在多线程环境中，当多个线程同时访问共享资源时，可能会出现数据不一致的问题，这就需要使用线程同步机制来保证数据的安全性。Java 中主要通过以下方式实现线程同步：

1. **`synchronized` 关键字**：
   `synchronized` 可以用于方法或代码块，为对象或类加锁，确保同一时刻只有一个线程能够执行被锁定的代码区域。

   ```java
   class Counter {
       private int count = 0;

       public synchronized void increment() {
           count++;
       }

       public synchronized int getCount() {
           return count;
       }
   }
   ```

2. **`Lock` 接口**：
   `java.util.concurrent.locks.Lock` 接口提供了比 `synchronized` 更灵活的锁操作，常见的实现类有 `ReentrantLock`。

   ```java
   import java.util.concurrent.locks.Lock;
   import java.util.concurrent.locks.ReentrantLock;

   class Counter {
       private int count = 0;
       private Lock lock = new ReentrantLock();

       public void increment() {
           lock.lock();
           try {
               count++;
           } finally {
               lock.unlock();
           }
       }

       public int getCount() {
           lock.lock();
           try {
               return count;
           } finally {
               lock.unlock();
           }
       }
   }
   ```

## 线程池的使用

线程池是一种线程使用模式，它预先创建一定数量的线程，并将它们保存在池中，等待任务的提交。使用线程池可以避免频繁地创建和销毁线程所带来的性能开销，同时还能对线程的数量和并发程度进行有效控制。Java 中通过 `Executor` 框架来管理线程池，常见的线程池类型包括：

- **`FixedThreadPool`**：可重用固定线程数的线程池。
- **`CachedThreadPool`**：可根据需要创建新线程的线程池，但在之前提交的任务完成前不会创建新线程。
- **`ScheduledThreadPool`**：支持定时及周期性任务执行的线程池。
- **`SingleThreadExecutor`**：相当于线程池大小为 1 的 `FixedThreadPool`，确保所有任务都在同一个线程中按顺序执行。

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ThreadPoolExample {
    public static void main(String[] args) {
        // 创建一个固定大小的线程池
        ExecutorService executor = Executors.newFixedThreadPool(3);

        // 提交任务到线程池
        for (int i = 0; i < 10; i++) {
            executor.submit(() -> {
                System.out.println("任务由 " + Thread.currentThread().getName() + " 执行");
            });
        }

        // 关闭线程池
        executor.shutdown();
    }
}
```

## 总结

Java 多线程编程是开发高性能、高并发应用程序的重要技术之一。通过合理地创建和管理线程、使用线程同步机制以及线程池，可以充分利用多核处理器的计算能力，提高程序的执行效率和响应速度。在实际开发中，需要根据具体的应用场景选择合适的线程模型和同步策略，同时注意避免线程安全问题和性能瓶颈，以构建稳定、高效的多线程应用程序。
