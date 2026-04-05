---
title: "LeetCode 25：K 个一组翻转链表（Java）"
description: "链表进阶高频题。很多 Java 面试官喜欢用它看指针控制能力。"
sidebar:
  order: 13
---

# LeetCode 25：K 个一组翻转链表（Java）

**力扣（中国）**：<https://leetcode.cn/problems/reverse-nodes-in-k-group/>

## 题目要点

给链表，每 `k` 个节点一组做翻转。

例如：

```text
1 -> 2 -> 3 -> 4 -> 5, k = 2
```

结果是：

```text
2 -> 1 -> 4 -> 3 -> 5
```

如果最后剩下不足 `k` 个，就保持原样。

## 思路拆解

这题难点不在“反转”，而在“分组”。

步骤是：

1. 每次先检查当前这一组够不够 `k` 个
2. 如果不够，直接结束
3. 如果够，就把这一组单独翻转
4. 再把翻转后的这组接回去

图示：

```text
dummy -> 1 -> 2 -> 3 -> 4 -> 5

先找出 [1,2]
翻转成 [2,1]
再接回原链表
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

    public ListNode reverseKGroup(ListNode head, int k) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode groupPrev = dummy;

        while (true) {
            ListNode kth = getKthNode(groupPrev, k);
            if (kth == null) {
                break;
            }

            ListNode groupNext = kth.next;

            ListNode prev = groupNext;
            ListNode cur = groupPrev.next;

            while (cur != groupNext) {
                ListNode next = cur.next;
                cur.next = prev;
                prev = cur;
                cur = next;
            }

            ListNode oldGroupHead = groupPrev.next;
            groupPrev.next = kth;
            groupPrev = oldGroupHead;
        }

        return dummy.next;
    }

    private ListNode getKthNode(ListNode start, int k) {
        while (start != null && k > 0) {
            start = start.next;
            k--;
        }
        return start;
    }
}
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(1)`

## 面试时可以怎么说

```text
我每次先找当前分组的第 k 个节点，如果不足 k 个就结束。
如果够，就把这一组链表原地翻转，再把前后指针重新接好。
为了处理头节点，我用了 dummy 节点统一逻辑。
```

## 口诀

```text
先看够不够 k 个，够了再整组翻
```
