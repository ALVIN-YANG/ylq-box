---
title: "LeetCode 347：前 K 个高频元素（Java）"
description: "堆题高频代表。适合用来检查你是否会频次统计和优先队列。"
sidebar:
  order: 10
---

# LeetCode 347：前 K 个高频元素（Java）

**力扣（中国）**：<https://leetcode.cn/problems/top-k-frequent-elements/>

## 题目要点

给你一个整数数组，返回其中出现频率前 `k` 高的元素。

例如：

```text
nums = [1,1,1,2,2,3], k = 2
答案是 [1,2]
```

## 思路分两步

### 第一步：先数频次

用 `HashMap` 统计每个数字出现了多少次。

```text
1 -> 3 次
2 -> 2 次
3 -> 1 次
```

### 第二步：维护一个大小为 k 的小顶堆

为什么是小顶堆？

因为我们只想保留“当前最强的前 k 名”。

规则：

- 堆里元素不足 `k`，直接放
- 堆满了，就拿当前元素和堆顶比较
- 如果当前元素频率更高，就把堆顶挤掉

图示：

```text
堆大小固定为 k

堆顶 = 当前前 k 名里最弱的那个
如果来了更强的，就把它换掉
```

## 完整 Java 代码

```java
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

public class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freqMap = new HashMap<>();
        for (int num : nums) {
            freqMap.put(num, freqMap.getOrDefault(num, 0) + 1);
        }

        PriorityQueue<int[]> minHeap = new PriorityQueue<>((a, b) -> a[1] - b[1]);

        for (Map.Entry<Integer, Integer> entry : freqMap.entrySet()) {
            int num = entry.getKey();
            int freq = entry.getValue();

            if (minHeap.size() < k) {
                minHeap.offer(new int[]{num, freq});
            } else if (freq > minHeap.peek()[1]) {
                minHeap.poll();
                minHeap.offer(new int[]{num, freq});
            }
        }

        int[] result = new int[k];
        for (int i = k - 1; i >= 0; i--) {
            result[i] = minHeap.poll()[0];
        }

        return result;
    }
}
```

## 复杂度

- 时间复杂度：`O(n log k)`
- 空间复杂度：`O(n)`

## 面试时可以怎么说

```text
我先用 HashMap 统计每个数字出现次数，再用一个大小为 k 的小顶堆维护当前前 k 个高频元素。
这样堆顶永远是前 k 名里频率最小的那个，遇到更高频的元素就替换掉它。
```
