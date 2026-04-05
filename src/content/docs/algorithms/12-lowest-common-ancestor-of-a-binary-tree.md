---
title: "LeetCode 236：二叉树的最近公共祖先（Java）"
description: "树递归高频题。非常适合区分“会背模板”和“真理解递归”的候选人。"
sidebar:
  order: 12
---

# LeetCode 236：二叉树的最近公共祖先（Java）

**力扣（中国）**：<https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/>

## 题目要点

给一棵二叉树，找两个节点 `p` 和 `q` 的最近公共祖先。

简单理解：

```text
离 p 和 q 最近，同时又是它们共同祖先的那个节点
```

## 这题的核心递归思路

从当前节点 `root` 出发，有三种情况：

1. `root == null`，返回 `null`
2. `root == p` 或 `root == q`，直接返回 `root`
3. 否则去左右子树分别找

然后看左右子树返回什么：

- 左右都不为空：说明 `p` 和 `q` 分别在两边，当前节点就是答案
- 只有一边不为空：说明答案在那一边
- 两边都为空：说明没找到

图示：

```text
        3
       / \
      5   1
     / \ / \
    6  2 0  8

p = 5, q = 1
答案就是 3
```

## 完整 Java 代码

```java
public class Solution {
    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) {
            return root;
        }

        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);

        if (left != null && right != null) {
            return root;
        }

        return left != null ? left : right;
    }
}
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(h)`，`h` 是树高

## 面试时可以怎么说

```text
这题用后序递归很好做。
我先去左右子树找 p 和 q。
如果左右子树都找到了，说明当前节点正好是它们第一次分叉的位置，也就是最近公共祖先。
如果只有一边找到了，就把那一边返回给上层。
```
