---
title: "LeetCode 102：二叉树的层序遍历（Java）"
description: "树的 BFS 代表题。面试里很常见，顺手还能引出队列和分层遍历。"
sidebar:
  order: 5
---

# LeetCode 102：二叉树的层序遍历（Java）

**力扣（中国）**：<https://leetcode.cn/problems/binary-tree-level-order-traversal/>

## 题目要点

按层从上到下遍历二叉树。

例如：

```text
    3
   / \
  9  20
    /  \
   15   7
```

输出：

```text
[[3], [9,20], [15,7]]
```

## 思路：队列 + 一层一层处理

层序遍历天然就是 BFS。

队列里的节点顺序会像这样流动：

```text
先放根节点 3
弹出 3，把 9 和 20 放进去
再弹出 9、20，把 15 和 7 放进去
```

关键点在于：

```text
每一轮先记录当前队列大小，这个大小就是“这一层有几个节点”
```

这样就能把每一层单独收集出来。

## 完整 Java 代码

```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

public class Solution {
    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) {
            return result;
        }

        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            int size = queue.size();
            List<Integer> level = new ArrayList<>();

            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);

                if (node.left != null) {
                    queue.offer(node.left);
                }
                if (node.right != null) {
                    queue.offer(node.right);
                }
            }

            result.add(level);
        }

        return result;
    }
}
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 面试时可以怎么说

```text
这是二叉树的 BFS。
我用队列保存当前层待处理的节点，每次先拿到当前队列大小，说明这一层有多少个节点。
处理完这一层后，把结果放进答案列表里。
```
