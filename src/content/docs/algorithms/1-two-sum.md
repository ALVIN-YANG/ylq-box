---
title: "LeetCode 1：两数之和（Java）"
description: "哈希表开门题。面试官通常用它看你会不会把 O(n^2) 优化成 O(n)。"
sidebar:
  order: 1
---

# LeetCode 1：两数之和（Java）

**力扣（中国）**：<https://leetcode.cn/problems/two-sum/>

这题很像面试里的热身题，但热身题最容易暴露基本功。

## 题目要点

给定数组 `nums` 和目标值 `target`，找出两个下标，使得：

```text
nums[i] + nums[j] == target
```

题目保证一定有解，而且不能重复使用同一个元素。

## 最容易想到的做法

双重循环，枚举所有两两组合。

```text
2  7  11  15
^  ^
2 + 7 = 9，找到答案
```

这个做法能过，但时间复杂度是 `O(n^2)`，面试官一般会继续问：能不能更快？

## 正解：哈希表

核心想法就一句话：

```text
我当前看到 nums[i]，就去问：target - nums[i] 之前出现过吗？
```

例如：

```text
nums = [2, 7, 11, 15], target = 9

i=0, 当前值 2，需要找 7
map 里没有 7，把 2 存进去

i=1, 当前值 7，需要找 2
map 里有 2，直接返回答案
```

图示：

```text
target = 9

遍历到 2: 需要 7   map = {2:0}
遍历到 7: 需要 2   map = {2:0} -> 命中
```

## 完整 Java 代码

```java
import java.util.HashMap;
import java.util.Map;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];

            if (map.containsKey(need)) {
                return new int[]{map.get(need), i};
            }

            map.put(nums[i], i);
        }

        return new int[0];
    }
}
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 面试时可以怎么说

可以直接这样讲：

```text
我用 HashMap 存已经遍历过的数字和它的下标。
每次遍历到当前值 x，就看 target - x 是否已经出现过。
如果出现过，直接返回；如果没有，就把 x 存进 map。
这样只需要一遍遍历，时间复杂度 O(n)。
```

## 口诀

```text
一遍循环，先找补数，找不到再入表
```
