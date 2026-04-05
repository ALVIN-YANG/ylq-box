---
title: "LeetCode 128：最长连续序列（Java）"
description: "哈希集合高频题。面试里常拿来考你会不会把看起来像排序的题做到 O(n)。"
sidebar:
  order: 8
---

# LeetCode 128：最长连续序列（Java）

**力扣（中国）**：<https://leetcode.cn/problems/longest-consecutive-sequence/>

## 题目要点

给你一个无序数组，求最长连续数字序列的长度。

例如：

```text
[100, 4, 200, 1, 3, 2]
```

最长连续序列是：

```text
1, 2, 3, 4
```

所以答案是 `4`。

## 这题的关键难点

如果你先排序，当然能做出来。

但题目希望更好：

```text
O(n)
```

## 思路：放进 HashSet，只从“起点”开始数

先把所有数字放进 `HashSet`，查找某个数是否存在就会很快。

然后不是对每个数都往后数，而是只对“序列起点”往后数。

什么叫起点？

```text
如果 num - 1 不存在，那 num 就是起点
```

例如：

```text
1,2,3,4

1 是起点，因为 0 不存在
2 不是起点，因为 1 存在
3 不是起点，因为 2 存在
4 不是起点，因为 3 存在
```

这样就不会重复统计。

## 完整 Java 代码

```java
import java.util.HashSet;
import java.util.Set;

public class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int num : nums) {
            set.add(num);
        }

        int maxLen = 0;

        for (int num : set) {
            if (!set.contains(num - 1)) {
                int current = num;
                int len = 1;

                while (set.contains(current + 1)) {
                    current++;
                    len++;
                }

                maxLen = Math.max(maxLen, len);
            }
        }

        return maxLen;
    }
}
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 面试时可以怎么说

```text
我先把所有元素放进 HashSet，目的是 O(1) 判断某个数是否存在。
然后只从序列起点开始向后统计连续长度，起点的判断条件是 num-1 不存在。
这样每个数最多被扫描常数次，总体可以做到 O(n)。
```
