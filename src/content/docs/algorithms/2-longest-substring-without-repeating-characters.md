---
title: "LeetCode 3：无重复字符的最长子串（Java）"
description: "滑动窗口代表题。很多面试官会用它判断你是不是真的会窗口题。"
sidebar:
  order: 2
---

# LeetCode 3：无重复字符的最长子串（Java）

**力扣（中国）**：<https://leetcode.cn/problems/longest-substring-without-repeating-characters/>

## 题目要点

给你一个字符串，找出其中**不含重复字符**的最长子串长度。

例如：

```text
输入：abcabcbb
输出：3
解释：最长无重复子串是 abc
```

## 这题为什么常考

因为它能同时考你三件事：

- 会不会双指针
- 会不会滑动窗口
- 会不会处理重复元素

## 思路：窗口右扩，重复时左缩

把一个窗口想成这样：

```text
[ left ........ right ]
```

规则很简单：

1. `right` 一直往右走，把字符放进窗口
2. 如果发现重复字符，说明窗口不合法
3. 这时移动 `left`，直到窗口重新合法

比如字符串 `abba`：

```text
a    -> 窗口 = a
ab   -> 窗口 = ab
abb  -> 重复了，左边开始收缩
bb   -> 还是重复，继续收缩
b    -> 合法
ba   -> 合法
```

图示：

```text
s = abcabcbb

abc      合法，长度 3
abca     重复 a，左边开始缩
bca      合法
```

## 完整 Java 代码

```java
import java.util.HashSet;
import java.util.Set;

public class Solution {
    public int lengthOfLongestSubstring(String s) {
        Set<Character> window = new HashSet<>();
        int left = 0;
        int maxLen = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);

            while (window.contains(c)) {
                window.remove(s.charAt(left));
                left++;
            }

            window.add(c);
            maxLen = Math.max(maxLen, right - left + 1);
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
我用滑动窗口维护一个无重复子串。
右指针负责扩张窗口，遇到重复字符时，左指针不断右移并删除字符，直到窗口重新无重复。
整个过程每个字符最多进窗口一次、出窗口一次，所以是 O(n)。
```

## 口诀

```text
右边进，左边缩，窗口里不能有重复
```
