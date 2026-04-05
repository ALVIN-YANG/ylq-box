---
title: "LeetCode 146：LRU 缓存（Java）"
description: "经典设计题。Java 后端面试里很常见，重点是哈希表加双向链表。"
sidebar:
  order: 9
---

# LeetCode 146：LRU 缓存（Java）

**力扣（中国）**：<https://leetcode.cn/problems/lru-cache/>

## 题目要点

实现一个 LRU（最近最少使用）缓存，要求：

- `get(key)`：有值就返回，没有就返回 `-1`
- `put(key, value)`：插入或更新
- 两个操作都要尽量快，理想是 `O(1)`

## 为什么这题常考

它不是单纯算法题，而是“小型系统设计题”。

面试官想看你能不能把两个结构配起来：

- **HashMap**：负责 `O(1)` 找节点
- **双向链表**：负责 `O(1)` 移动节点顺序

## 结构图

```text
head <-> 最近使用 <-> ... <-> 最久未使用 <-> tail
```

规则：

- `get` 命中：把节点挪到最前面
- `put` 已存在：更新值，再挪到最前面
- `put` 新节点：放到最前面
- 超容量：删掉最后一个节点

## 思路拆开看

### 1. 为什么不能只用 HashMap

因为你虽然能快速找到 key，但你不知道谁最久没用。

### 2. 为什么不能只用链表

因为你能维护顺序，但查某个 key 会退化到 `O(n)`。

### 3. 两者结合

```text
map: key -> 节点地址
链表: 维护访问顺序
```

这就是标准答案。

## 完整 Java 代码

```java
import java.util.HashMap;
import java.util.Map;

public class LRUCache {
    private static class Node {
        int key;
        int value;
        Node prev;
        Node next;

        Node() {
        }

        Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head;
    private final Node tail;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new HashMap<>();
        this.head = new Node();
        this.tail = new Node();

        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        Node node = map.get(key);
        if (node == null) {
            return -1;
        }

        moveToHead(node);
        return node.value;
    }

    public void put(int key, int value) {
        Node node = map.get(key);

        if (node != null) {
            node.value = value;
            moveToHead(node);
            return;
        }

        Node newNode = new Node(key, value);
        map.put(key, newNode);
        addToHead(newNode);

        if (map.size() > capacity) {
            Node removed = removeTail();
            map.remove(removed.key);
        }
    }

    private void moveToHead(Node node) {
        removeNode(node);
        addToHead(node);
    }

    private void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;

        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private Node removeTail() {
        Node node = tail.prev;
        removeNode(node);
        return node;
    }
}
```

## 复杂度

- 时间复杂度：`get` 和 `put` 都是 `O(1)`
- 空间复杂度：`O(capacity)`

## 面试时可以怎么说

```text
LRU 需要同时满足两件事：快速查找和快速维护最近使用顺序。
所以我用 HashMap 做 key 到节点的映射，用双向链表维护访问顺序。
最近访问的节点放头部，最久没访问的节点在尾部，超容量时直接删尾部节点。
```
