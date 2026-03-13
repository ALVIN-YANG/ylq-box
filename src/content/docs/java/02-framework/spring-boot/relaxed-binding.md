---
title: SpringBoot Relaxed Binding
description: Spring Boot 松散绑定特性，允许在环境变量、命令行参数、属性文件中使用不同风格的属性键命名
sidebar:
  label: Relaxed Binding
---

Spring Boot 的 Relaxed Binding 特性是为了提供灵活性，允许你在不同配置源（如环境变量、命令行参数、属性文件等）中使用不同风格的属性键命名，而 Spring Boot 会自动将它们统一为 Java 代码中的属性键格式。

- 环境变量优先级比 .properties 配置更高

- 属性加载：当 Spring Boot 应用启动时，它会首先加载.properties 文件中的配置属性。

- 环境变量检查：在加载了.properties 文件之后，Spring Boot 会检查当前操作系统的环境变量。

- 属性名称转换：Spring Boot 会将环境变量的命名风格转换为与.properties 文件中的属性键相匹配的格式。转换规则如下：

  - 将所有的大写字母转换为小写。
  - 将中划线（-）和点（.）替换为下划线（\_）。

示例：
环境变量 SPRING_FIRST_SECOND_THIRD 会替换以下配置

```
spring.first.second.third = xxx
spring.first.second-third = xxx
spring.first.secondThird = xxx
```
