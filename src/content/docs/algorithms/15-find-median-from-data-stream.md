---
title: "LeetCode 295：数据流的中位数（Java）"
description: "堆设计题高频代表。Java 后端面试很喜欢考这个来判断数据结构掌握程度。"
sidebar:
  order: 15
---

# LeetCode 295：数据流的中位数（Java）

**力扣（中国）**：<https://leetcode.cn/problems/find-median-from-data-stream/>

## 题目要点

数据一个一个进来，要支持两个操作：

- `addNum(num)`：加入一个数字
- `findMedian()`：随时返回当前中位数

## 为什么常考

因为这题能同时看出来你会不会：

- 堆
- 数据流处理
- 平衡两个数据结构

## 核心思路：两个堆

用两个堆把数据分成两半：

- `small`：大顶堆，保存较小的一半
- `large`：小顶堆，保存较大的一半

保持这两个性质：

1. `small` 里的元素都小于等于 `large` 里的元素
2. 两边元素个数差不能超过 1

图示：

```text
small(大顶堆) | large(小顶堆)

左边放小的一半
右边放大的一半
```

那中位数就很好算：

- 总数是奇数：中位数在元素更多的那边堆顶
- 总数是偶数：中位数是两个堆顶平均值

## 完整 Java 代码

```java
import java.util.Collections;
import java.util.PriorityQueue;

public class MedianFinder {
    private final PriorityQueue<Integer> small;
    private final PriorityQueue<Integer> large;

    public MedianFinder() {
        small = new PriorityQueue<>(Collections.reverseOrder());
        large = new PriorityQueue<>();
    }

    public void addNum(int num) {
        if (small.isEmpty() || num <= small.peek()) {
            small.offer(num);
        } else {
            large.offer(num);
        }

        if (small.size() > large.size() + 1) {
            large.offer(small.poll());
        } else if (large.size() > small.size() + 1) {
            small.offer(large.poll());
        }
    }

    public double findMedian() {
        if (small.size() > large.size()) {
            return small.peek();
        }

        if (large.size() > small.size()) {
            return large.peek();
        }

        return (small.peek() + large.peek()) / 2.0;
    }
}
```

## 复杂度

- `addNum` 时间复杂度：`O(log n)`
- `findMedian` 时间复杂度：`O(1)`
- 空间复杂度：`O(n)`

## 面试时可以怎么说

```text
我用两个堆维护数据流的左右两半。
左边是大顶堆，右边是小顶堆，并且保证两边数量平衡。
这样插入时只需要调整堆，取中位数时直接看堆顶即可。
```
