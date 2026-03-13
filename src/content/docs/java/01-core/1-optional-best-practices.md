---
title: Optional 的用法
description: Java 8 引入的 Optional 容器类，用于优雅地处理空值判断，避免多层嵌套 null 检查
sidebar:
  label: Optional 用法
---

## 使用 Optional 的目的

- 防御式编程判空
- **避免多层嵌套 if xx == null 检查**

## 使用示例

### 不用 Optional 的嵌套示例

```java
public static void checkEmpty(Scenic scenic) {
        if (scenic == null) {
            throw new RuntimeException("数据错误");
        }
        if (scenic.getCity() == null) {
            throw new RuntimeException("数据错误");
        }
        if (scenic.getCity().getCountry() == null) {
            throw new RuntimeException("数据错误");
        }
        if (scenic.getCity().getCountry().getContinent() == null) {
            throw new RuntimeException("数据错误");
        }
        if (scenic.getCity().getCountry().getContinent().getName() == null
                || scenic.getCity().getCountry().getContinent().getName().isBlank()) {
            throw new RuntimeException("数据错误");
        }
    }
```

### 使用 Optional 的嵌套示例

```java
public static void checkEmptyByOptional(Scenic scenic) {
        Optional.ofNullable(scenic)
                .map(Scenic::getCity)
                .map(City::getCountry)
                .map(Country::getContinent)
                .map(Continent::getName)
                .filter(name -> !name.isBlank())
                .orElseThrow(() -> new RuntimeException("数据错误"));
    }
```

### map() 方法的工作原理

- map() 方法的作用是从一个 `Optional<T>` 的值中提取一个新值，这个新值是通过函数转换得到的。

例如，假设 `Optional<Scenic>` 的值是 scenic，map(Scenic::getCity) 会调用 scenic.getCity()，并将结果包装成一个新的 `Optional<City>`。

## Optional 详细用法

### 1、创建 Optional 对象

- 创建一个空的 Optional 实例

  ```java
  Optional<String> emptyOptional = Optional.empty();
  ```

- 创建一个包含非 null 值的 Optional

  ```java
  Optional<String> optional = Optional.of("Hello");
  ```

- 创建一个可能为 null 的值的 Optional

  ```java
  Optional<String> nullableOptional = Optional.ofNullable(null);
  ```

### 2、检查值是否存在

- isPresent()

- isEmpty()

### 3、获取值

- get()

  - 如果 Optional 包含值，则返回值，否则抛出 NoSuchElementException

- orElse(T other)

  - 如果 Optional 包含值，则返回值，否则返回默认值

- orElseGet

  - 如果 Optional 包含值，则返回值，否则调用传入的函数获取返回值

  ```java
  String value = optional.orElseGet(() -> "Generated Default");
  ```

- orElseThrow
  - 如果 Optional 包含值，则返回值，否则抛出自定义异常。

### 4、操作和转换

- ifPresent

  - 如果 Optional 包含值，则执行指定的操作

  ```java
  optional.ifPresent(System.out::println);
  ```

- ifPresentOrElse

  - 如果 Optional 包含值，则执行指定的操作，否则执行空操作。

  ```java
  optional.ifPresentOrElse(System.out::println, () -> System.out.println("No value present"));
  ```

- map

  - 返回 Optional(函数返回值)

  ```java
  Optional<Integer> length = optional.map(Scenic::getCity);
  ```

- flatMap

  - 返回 函数值，这个返回值必须是 Optional 类型

  ```java
  Optional<String> result = optional.flatMap(s -> Optional.of(s.toUpperCase()));
  ```

- filter
  - 如果值存在且满足条件，则返回包含该值的 Optional，否则返回空。
  ```java
  Optional<String> filtered = optional.filter(s -> s.length() > 5);
  ```
- or
  - 如果当前 Optional 为空，则通过函数生成一个新的 Optional
  ```java
  Optional<String> combined = optional.or(() -> Optional.of("Alternative"));
  ```
