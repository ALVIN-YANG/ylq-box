---
title: "LeetCode 200：岛屿数量（Java）"
description: "DFS/BFS 的经典题。面试官很爱用它看你会不会网格遍历和搜索。"
sidebar:
  order: 6
---

# LeetCode 200：岛屿数量（Java）

**力扣（中国）**：<https://leetcode.cn/problems/number-of-islands/>

## 题目要点

二维网格里：

- `'1'` 表示陆地
- `'0'` 表示海水

问一共有多少个岛。

## 思路：找到一块陆地，就把整座岛染掉

外层双循环扫描整个网格。

一旦发现一个 `'1'`，说明找到了一座新岛：

1. 计数器加一
2. 用 DFS 把和它连在一起的陆地全部标记掉

图示：

```text
1 1 0 0
1 1 0 0
0 0 1 0
0 0 0 1

第一块连通区域 -> 1 座岛
第二块单独的 1 -> 1 座岛
第三块单独的 1 -> 1 座岛
```

为什么要“染掉”？

```text
因为不染掉，后面扫到同一座岛的其他格子时会重复计数
```

## 完整 Java 代码

```java
public class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) {
            return 0;
        }

        int count = 0;

        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (grid[i][j] == '1') {
                    count++;
                    dfs(grid, i, j);
                }
            }
        }

        return count;
    }

    private void dfs(char[][] grid, int i, int j) {
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) {
            return;
        }

        if (grid[i][j] != '1') {
            return;
        }

        grid[i][j] = '0';

        dfs(grid, i + 1, j);
        dfs(grid, i - 1, j);
        dfs(grid, i, j + 1);
        dfs(grid, i, j - 1);
    }
}
```

## 复杂度

- 时间复杂度：`O(m * n)`
- 空间复杂度：`O(m * n)`，最坏情况是递归栈

## 面试时可以怎么说

```text
我把每个 1 看成陆地，只要扫描到一个还没访问过的 1，就说明找到一座新岛。
然后用 DFS 把这座岛的所有陆地都改成 0，避免重复统计。
整个网格每个格子最多访问一次，所以总复杂度是 O(m*n)。
```
