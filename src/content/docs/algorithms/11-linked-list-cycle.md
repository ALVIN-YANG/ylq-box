---
title: "LeetCode 141：环形链表（Java）"
description: "双指针经典题。简单，但经常是链表专题的第一道追问题。"
sidebar:
  order: 11
---

# LeetCode 141：环形链表（Java）

**力扣（中国）**：<https://leetcode.cn/problems/linked-list-cycle/>

## 题目要点

判断一个链表里是否有环。

也就是：

```text
沿着 next 一直走，会不会绕回来
```

## 思路：快慢指针

这题最经典的做法就是：

- 慢指针一次走一步
- 快指针一次走两步

如果没有环：

```text
快指针会先走到 null
```

如果有环：

```text
快指针一定会在环里追上慢指针
```

图示：

```text
慢：1 步 1 步走
快：2 步 2 步走

有环时，快指针像跑道上超车，最终会追上慢指针
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

    public boolean hasCycle(ListNode head) {
        if (head == null || head.next == null) {
            return false;
        }

        ListNode slow = head;
        ListNode fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;

            if (slow == fast) {
                return true;
            }
        }

        return false;
    }
}
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(1)`

## 面试时可以怎么说

```text
我用 Floyd 判圈法，也就是快慢指针。
慢指针每次走一步，快指针每次走两步。
如果链表有环，快指针一定会在环内追上慢指针；如果没有环，快指针会先到 null。
```
