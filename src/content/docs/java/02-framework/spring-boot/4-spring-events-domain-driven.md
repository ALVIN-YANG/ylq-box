---
title: "用 Spring Event 解耦业务：从贫血模型到 DDD 的第一步"
description: "还在把发送邮件、扣减库存的代码直接塞进下单逻辑里？本文教你如何使用 Spring 提供的事件发布订阅机制，写出高内聚低耦合的业务代码，为未来的微服务拆分打下地基。"
sidebar:
  order: 4
---

# 用 Spring Event 解耦业务：从贫血模型到 DDD 的第一步

在我们审查很多初中级开发者的代码时，经常会看到一个巨大的 `OrderService.createOrder()` 方法，里面塞满了各种乱七八糟的逻辑。

```java
@Transactional
public void createOrder(OrderDTO dto) {
    // 1. 业务主干：落库保存订单
    orderRepository.save(order);
    
    // 2. 旁支逻辑开始发散...
    inventoryService.deduct(order.getItems()); // 扣库存
    couponService.useCoupon(dto.getCouponId()); // 标记优惠券已使用
    emailService.sendOrderSuccessEmail(order.getUserId()); // 发送邮件
    loyaltyService.addPoints(order.getUserId(), order.getAmount()); // 增加积分
}
```

这就是最典型的**大泥球架构（Big Ball of Mud）**。
当公司的积分系统崩溃，或者邮件网关超时时，**因为它们写在同一个事务方法里，整个下单接口会被直接阻塞甚至回滚！** 顾客无法付钱，公司造成实质性损失。

作为架构师，如果要推行 DDD（领域驱动设计）或者准备未来将这些模块拆分为微服务，你必须在单体应用内部就切断这种硬编码的耦合。

**杀手锏就是：Spring 内部事件机制（Spring ApplicationEvent）。**

## 1. 核心理念：领域事件（Domain Event）

在 DDD 中，当核心业务（下单）完成时，我们不应该去主动指挥别人（发邮件、加积分），而是应该**向全系统广播一个事实：“嘿！我刚刚创建了一个订单！”**。

至于谁对这个事实感兴趣，谁自己去订阅。下订单的模块不需要知道邮件模块的存在。

### Step 1: 定义一个事件
继承或直接定义一个普通的 POJO。
```java
public record OrderCreatedEvent(String orderId, Long userId, BigDecimal amount) {
}
```

### Step 2: 核心业务只负责发布事件
```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void createOrder(OrderDTO dto) {
        // 1. 业务主干：仅仅保存订单，干净利落
        Order order = orderRepository.save(new Order(dto));
        
        // 2. 发布领域事件
        eventPublisher.publishEvent(new OrderCreatedEvent(order.getId(), order.getUserId(), order.getAmount()));
    }
}
```

### Step 3: 各个模块自己订阅并处理
在积分模块的 Service 里，写一个监听器：
```java
@Service
@Slf4j
public class LoyaltyService {

    @Async // 可以选择异步执行，不阻塞主线程
    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("监听到订单创建：{}, 给用户 {} 增加积分", event.orderId(), event.userId());
        // 执行增加积分逻辑...
    }
}
```

代码的耦合被瞬间切断。未来如果业务要求“下单还要给用户发短信”，你只需要在短信模块加一个监听器即可，**订单服务的核心代码一行都不用改！** 完美符合“开闭原则（OCP）”。

## 2. 高级避坑：警惕事务未提交导致的数据不一致

仔细看上面的代码，隐藏着一个企业级开发中最容易踩的坑。

当 `OrderService` 调用 `publishEvent` 时，此时 `createOrder` 方法的 `@Transactional` 事务**还没有提交**（因为方法还没结束，或者发生异常要回滚）。
但 Spring 的 `@EventListener` 默认是**同步立即执行的**！

如果 `LoyaltyService` 收到了事件，并且它在一个新线程里去数据库查这个订单，**它会查不到！**因为数据还在 MySQL 的隔离缓存区里，没有 commit。

如果 `LoyaltyService` 给用户发了成功的短信，但随后 `createOrder` 发生了异常导致订单回滚，用户收到了短信却没有订单，引发严重的客诉。

### 终极解法：@TransactionalEventListener

Spring 为这种需要严格绑定数据库事务的场景，提供了一个专门的注解。

```java
@Service
@Slf4j
public class NotificationService {

    // 重点：只有当发布者的事务成功 Commit 之后，才会触发这个监听器！
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void sendEmailAfterCommit(OrderCreatedEvent event) {
        log.info("订单事务已落盘，安全地发送通知邮件给用户 {}", event.userId());
        // 发送邮件...
    }
}
```
通过使用 `@TransactionalEventListener`，我们保证了旁路逻辑永远不会跑在主业务落盘之前，也绝不会在主业务失败回滚时引发不可逆的外部调用（如发短信、发邮件）。

## 3. 为什么这是走向微服务的第一步？

当你的单体应用中，所有的跨模块通信都变成了 `ApplicationEventPublisher` 时。系统就已经在逻辑上完成了微服务化。

当有一天你们的单体应用扛不住了，需要把“积分服务”独立部署到另一台机器上。
你不需要去修改那些散落在各处的调用链路。你只需要引入类似 **Kafka 或者 RabbitMQ**，把单体内的 `ApplicationEventPublisher.publishEvent()` 替换为 `KafkaTemplate.send()`。把内部的 `@EventListener` 替换为 `@KafkaListener`。

整个系统架构的重构如丝般顺滑，这就是高内聚、低耦合带来的终极架构红利。
