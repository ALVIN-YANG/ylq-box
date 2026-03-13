---
title: "无状态微服务鉴权：Spring Security OAuth2 + JWT 最佳实践"
description: "传统的 Session 鉴权在微服务时代已经彻底死亡。本文带你拆解如何在 2026 年利用 Spring Security 结合 RSA 非对称加密构建极其安全的 JWT 资源服务器。"
sidebar:
  order: 3
---

# 无状态微服务鉴权：Spring Security OAuth2 + JWT 最佳实践

在单体应用时代，用户的登录状态全部存在 Tomcat 的 Session 里（本质是服务器内存）。
但当架构演进为微服务集群时，如果还用 Session，你就必须把 Session 集中存放到 Redis 里（共享 Session）。对于一个拥有上千个微服务节点的大型系统来说，这种**“每次请求都要去 Redis 里查一下用户状态”**的集中式架构，不仅带来了极高的网络开销，也成为了潜在的系统单点瓶颈。

在 2026 年，微服务间流转的绝对标准凭证，毫无疑问是 **JWT (JSON Web Token)**。
而配合它的终极防线，则是大名鼎鼎（且配置极其复杂的）**Spring Security**。

## 1. 为什么是无状态（Stateless）？

JWT 的核心理念是：**把鉴权信息全部写在 Token 本身里。**

当你登录成功后，认证中心（Authorization Server）颁发给你一个 JWT。这个 Token 内部包含了你的 `UserId`、你的角色 `ROLE_ADMIN`，并且在末尾打上了一个无法被篡改的**密码学数字签名**。

当你拿着这个 Token 去请求订单服务（Order Service）时：
订单服务**不需要去问数据库**，也**不需要去查 Redis**。它只需要用事先约定好的公钥（Public Key），本地校验一下这个 Token 的签名是否合法、有没有过期。如果合法，它直接从 Token 内部把 `UserId` 取出来执行业务即可。

这就是**无状态**——微服务节点可以随时被拉起、随时被销毁，它们不保存任何登录状态，性能极高。

## 2. RSA 非对称加密：生产环境的安全底线

很多新手教程教你用一段字符串（比如 `my-secret-key-123456`）作为对称加密（HMAC）的密钥来签发 JWT。

**这是生产环境的绝对大忌！**

如果在微服务集群中，你把这串密钥写在每个微服务的配置文件里。只要有一个边缘的边缘服务（比如短信服务）的代码被黑客拿到，密钥就会泄露。黑客可以自己签发一个包含 `ROLE_SUPER_ADMIN` 的 JWT，畅通无阻地黑掉整个系统。

**2026 架构标准：使用 RSA 非对称加密。**

- **认证中心 (Auth Server)**：手里死死捏着**私钥 (Private Key)**，只有它有资格签发和颁发 JWT。
- **其他微服务 (Resource Server)**：手里只有**公钥 (Public Key)**。公钥是公开的，即使泄露了也无所谓。微服务只能用公钥来**验证** JWT 是不是认证中心签发的，绝无能力伪造 JWT。

## 3. Spring Security 资源服务器极简配置

在 Spring Boot 3 中，配置一个只认公钥的 OAuth2 资源服务器变得极其简单。

### 引入依赖
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

### application.yml 配置
你只需要在配置里指定公钥的获取地址（JWK Set URI），Spring Boot 会在启动时自动去认证中心拉取公钥并缓存下来：
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # 认证中心暴露的公钥获取端点
          jwk-set-uri: http://auth-server/oauth2/jwks
```

### SecurityFilterChain 配置
在配置类中，彻底抛弃旧时代的 `WebSecurityConfigurerAdapter`，采用现代化的函数式配置：

```java
@Configuration
@EnableWebSecurity
public class ResourceServerConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. 关闭 CSRF（因为我们不使用 Cookie，防跨站伪造无需开启）
            .csrf(csrf -> csrf.disable())
            
            // 2. 声明这是一个完全无状态的会话，禁止 Spring 生成 HttpSession
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 3. 路由权限拦截规则
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            
            // 4. 开启 JWT 资源服务器模式
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }
}
```

## 4. 终极挑战：Token 无法撤销怎么办？

JWT 无状态带来的最大代价是：**签发出去的 Token 就像泼出去的水，在过期之前无法被服务器主动收回。**
如果用户点击了“注销登录”，或者系统发现某个用户的账号被盗了，你需要立刻踢他下线，怎么办？

**解决方案：JWT 黑名单机制 (Redis Blacklist + 短过期时间)**

1. **缩短过期时间**：将 Access Token 的有效期设置得很短（例如 15 分钟），即使被盗，风险期也很短。配合长有效期的 Refresh Token（存放在 HttpOnly Cookie 中）来无感刷新。
2. **引入 Redis 拦截黑名单**：当用户注销或被封禁时，将他当前的 JWT 的唯一标识（`jti` 字段）或者 `UserId` 存入 Redis，设置存活时间等于该 Token 的剩余过期时间。
3. **在网关层 (Gateway) 增加拦截器**：每次请求经过网关时，网关不仅校验 JWT 签名，还去 Redis 里 `EXISTS` 一下这个 Token 是否在黑名单中。

有人会问：“既然还是要查 Redis，那和以前的集中式 Session 有什么区别？”

区别大了！**由于黑名单里只有被注销的那极少部分 Token（可能只有几十条记录）**，而不是几百万在线用户的全量 Session，这次查询可以被网关的极小本地缓存（Caffeine）挡住大半，对 Redis 的压力可以忽略不计。

## 总结

微服务安全不是儿戏。在 2026 年，摒弃 Session，拥抱 **“RSA 私钥签发 + 公钥本地校验 + 网关 Redis 黑名单兜底”** 的三段式防御体系，才是一名合格架构师应有的系统安全观。
