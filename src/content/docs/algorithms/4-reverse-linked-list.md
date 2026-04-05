---
title: "LeetCode 206：反转链表（Java）"
description: "链表最基础的一题。很多面试官会把它当成链表基本功检查。"
sidebar:
  order: 4
---

# LeetCode 206：反转链表（Java）

**力扣（中国）**：<https://leetcode.cn/problems/reverse-linked-list/>

## 题目要点

把单链表整个反过来。

例如：

```text
1 -> 2 -> 3 -> null
```

反转后变成：

```text
3 -> 2 -> 1 -> null
```

## 核心思路

链表反转本质上是在改指针方向。

原来是：

```text
prev <- cur -> next
```

每走一步，都做三件事：

1. 先保存 `next`
2. 再让 `cur.next = prev`
3. 然后整体往前推进

过程图：

```text
初始：prev = null, cur = 1 -> 2 -> 3

第 1 步：1 -> null
第 2 步：2 -> 1 -> null
第 3 步：3 -> 2 -> 1 -> null
```

## 完整 Java 代码

```java
public class Solution {
    static class ListNode {
        int val;
        ListNode next;

        ListNode(int val) {
            this.val = val;
        }
    }

    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode cur = head;

        while (cur != null) {
            ListNode next = cur.next;
            cur.next = prev;
            prev = cur;
            cur = next;
        }

        return prev;
    }
}
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(1)`

## 面试时可以怎么说

```text
我用三个指针：prev、cur、next。
每次先保存 cur 的下一个节点，再把 cur 指向 prev，最后整体向前推进。
这个方法只遍历一次链表，空间复杂度是 O(1)。
```

## 口诀

```text
先存 next，再反指针，prev 和 cur 一起走
```
