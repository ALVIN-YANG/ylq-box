---
title: "LeetCode 20：有效的括号（Java）"
description: "栈的标准题。题不难，但非常适合看候选人代码是否干净。"
sidebar:
  order: 3
---

# LeetCode 20：有效的括号（Java）

**力扣（中国）**：<https://leetcode.cn/problems/valid-parentheses/>

## 题目要点

给你一个只包含 `()[]{}` 的字符串，判断括号是否有效。

有效的意思是：

- 左括号必须用相同类型的右括号闭合
- 左括号必须按正确顺序闭合

## 思路：栈

括号题几乎都和栈有关，因为它天然符合：

```text
后进先出
```

比如：

```text
{ [ ( ) ] }
```

匹配顺序其实是：

```text
先匹配 ()，再匹配 []，最后匹配 {}
```

这就是栈。

## 一个很好写的技巧

不是把左括号本身压栈，而是把**它对应的右括号**压栈。

例如读到 `(` 时，直接压入 `)`。

这样后面遇到右括号时，只需要比较是不是和栈顶相等。

图示：

```text
读到 (  -> 栈里放 )
读到 [  -> 栈里放 ]
读到 ]  -> 栈顶必须是 ]
读到 )  -> 栈顶必须是 )
```

## 完整 Java 代码

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();

        for (char c : s.toCharArray()) {
            if (c == '(') {
                stack.push(')');
            } else if (c == '[') {
                stack.push(']');
            } else if (c == '{') {
                stack.push('}');
            } else {
                if (stack.isEmpty() || stack.pop() != c) {
                    return false;
                }
            }
        }

        return stack.isEmpty();
    }
}
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 面试时可以怎么说

```text
我用栈保存当前还没匹配掉的括号。
为了让代码更简洁，我压栈时直接压入期望匹配的右括号。
这样遇到右括号时只要和栈顶比较即可。
最后栈为空，说明全部匹配成功。
```

## 口诀

```text
左括号压预期，右括号看栈顶
```
