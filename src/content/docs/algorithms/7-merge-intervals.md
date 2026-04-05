---
title: "LeetCode 56：合并区间（Java）"
description: "排序加区间合并的标准题。写业务代码和写题解都很常见。"
sidebar:
  order: 7
---

# LeetCode 56：合并区间（Java）

**力扣（中国）**：<https://leetcode.cn/problems/merge-intervals/>

## 题目要点

给一组区间，合并所有重叠区间。

例如：

```text
[[1,3],[2,6],[8,10],[15,18]]
```

合并后：

```text
[[1,6],[8,10],[15,18]]
```

## 思路：先排序，再边走边合并

如果区间不排序，很难判断谁和谁合并。

所以第一步一定是：

```text
按区间左端点升序排序
```

排完后，后面的区间只需要和“当前合并结果的最后一个区间”比较即可。

图示：

```text
[1,3] [2,6] [8,10]

[1,3] 和 [2,6] 重叠 -> 合并成 [1,6]
[1,6] 和 [8,10] 不重叠 -> 直接加入
```

判断是否重叠的标准：

```text
上一个区间的右端点 >= 当前区间的左端点
```

## 完整 Java 代码

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals == null || intervals.length <= 1) {
            return intervals;
        }

        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> result = new ArrayList<>();

        for (int[] interval : intervals) {
            if (result.isEmpty() || result.get(result.size() - 1)[1] < interval[0]) {
                result.add(new int[]{interval[0], interval[1]});
            } else {
                result.get(result.size() - 1)[1] =
                        Math.max(result.get(result.size() - 1)[1], interval[1]);
            }
        }

        return result.toArray(new int[result.size()][]);
    }
}
```

## 复杂度

- 时间复杂度：`O(n log n)`，主要花在排序
- 空间复杂度：`O(n)`

## 面试时可以怎么说

```text
这题先排序是关键。
排序后只需要维护当前已经合并好的最后一个区间。
如果新区间和它重叠，就更新右边界；如果不重叠，就直接加入结果。
```
