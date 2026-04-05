---
title: "LeetCode 76：最小覆盖子串（Java）"
description: "滑动窗口进阶题。会这题，基本说明窗口套路真的过关了。"
sidebar:
  order: 14
---

# LeetCode 76：最小覆盖子串（Java）

**力扣（中国）**：<https://leetcode.cn/problems/minimum-window-substring/>

## 题目要点

给两个字符串 `s` 和 `t`，找出 `s` 中最短的子串，要求它包含 `t` 的所有字符。

例如：

```text
s = ADOBECODEBANC
t = ABC
```

答案是：

```text
BANC
```

## 这题为什么难

因为它不是简单“有没有”，而是：

1. 要先满足覆盖条件
2. 满足后还要尽量缩小

## 标准思路：滑动窗口

窗口套路还是那套，但这里要维护字符计数。

整体过程：

1. 右指针扩张窗口，直到窗口已经覆盖 `t`
2. 一旦覆盖成功，就尝试移动左指针，让窗口尽量变短
3. 在收缩过程中持续更新最优答案

图示：

```text
ADOBEC   -> 已经覆盖 ABC
尝试从左边缩
...
BANC     -> 更短，仍然覆盖
```

## 完整 Java 代码

```java
import java.util.HashMap;
import java.util.Map;

public class Solution {
    public String minWindow(String s, String t) {
        if (s.length() < t.length()) {
            return "";
        }

        Map<Character, Integer> need = new HashMap<>();
        Map<Character, Integer> window = new HashMap<>();

        for (char c : t.toCharArray()) {
            need.put(c, need.getOrDefault(c, 0) + 1);
        }

        int left = 0;
        int valid = 0;
        int start = 0;
        int minLen = Integer.MAX_VALUE;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);

            if (need.containsKey(c)) {
                window.put(c, window.getOrDefault(c, 0) + 1);
                if (window.get(c).intValue() == need.get(c).intValue()) {
                    valid++;
                }
            }

            while (valid == need.size()) {
                if (right - left + 1 < minLen) {
                    minLen = right - left + 1;
                    start = left;
                }

                char d = s.charAt(left);
                left++;

                if (need.containsKey(d)) {
                    if (window.get(d).intValue() == need.get(d).intValue()) {
                        valid--;
                    }
                    window.put(d, window.get(d) - 1);
                }
            }
        }

        return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
    }
}
```

## 复杂度

- 时间复杂度：`O(m + n)`
- 空间复杂度：`O(k)`，`k` 是字符集规模

## 面试时可以怎么说

```text
我用滑动窗口维护一个当前子串，need 记录目标字符频次，window 记录当前窗口频次。
右指针负责扩张直到满足覆盖条件，满足后左指针尽量收缩，从而更新最短答案。
```

## 口诀

```text
先扩到满足，再缩到最短
```
