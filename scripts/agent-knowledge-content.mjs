export const bookRoutes = {
  foundations: [
    { title: '《深入理解 AI Agent》', location: '第 1 章 · PDF 15 至 34 页', note: 'Agent、Harness、上下文、工具与环境的基础边界。' },
    { title: '《智能体 AI 漫游指南》', location: '第 15 章 · PDF 290 至 292 页', note: 'Agentic AI 的概念、架构与适用场景。' },
  ],
  'model-context': [
    { title: '《深入理解 AI Agent》', location: '第 2 章 · PDF 36 至 75 页', note: '上下文结构、Prompt、状态栏、Skills 与压缩策略。' },
    { title: '《智能体 AI 漫游指南》', location: '第 18 章 · PDF 341 至 364 页', note: 'Harness 的上下文管理、工具编排和运行约束。' },
  ],
  'knowledge-state': [
    { title: '《深入理解 AI Agent》', location: '第 3 章 · PDF 77 至 105 页', note: '用户记忆、RAG、知识组织与检索。' },
    { title: '《智能体 AI 漫游指南》', location: '第 16 至 17 章 · PDF 293 至 340 页', note: 'RAG 管线和 Agent Memory 的类型与实现。' },
  ],
  'tools-environment': [
    { title: '《深入理解 AI Agent》', location: '第 4 至 5 章 · PDF 107 至 164 页', note: '工具分类、设计、安全、异步工具和代码能力。' },
    { title: '《智能体 AI 漫游指南》', location: '第 22 至 23 章 · PDF 398 至 421 页', note: 'MCP、Tool、Resource、Prompt 与 Skill。' },
  ],
  'runtime-orchestration': [
    { title: '《深入理解 AI Agent》', location: '第 1 章 1.2、第 4 章 4.7 · PDF 26 至 34、120 至 130 页', note: 'Harness 约束、验证、纠正和异步运行。' },
    { title: '《智能体 AI 漫游指南》', location: '第 18 至 21、26 章 · PDF 341 至 397、463 至 494 页', note: 'Loop、工作流模式、环境、框架与生产运行。' },
  ],
  'evaluation-evolution': [
    { title: '《深入理解 AI Agent》', location: '第 6、8 章 · PDF 166 至 196、233 至 246 页', note: '评测环境、指标、可观测性和持续进化。' },
    { title: '《智能体 AI 漫游指南》', location: '第 14、26 章 · PDF 274 至 288、463 至 494 页', note: 'LLM 评估和生产级 Agent 测试。' },
  ],
  'safety-governance': [
    { title: '《深入理解 AI Agent》', location: '第 1 至 4 章安全条目 · PDF 15 至 133 页', note: '提示注入、权限、隐私、工具误用和记忆污染。' },
    { title: '《智能体 AI 漫游指南》', location: '第 22、26、27 章 · PDF 398 至 416、463 至 514 页', note: '协议安全、运行约束、审批和可恢复交互。' },
  ],
  'production-platform': [
    { title: '《深入理解 AI Agent》', location: '第 6 章 6.8 至 6.11 · PDF 189 至 196 页', note: '可观测性、生产评测基础设施和仿真环境。' },
    { title: '《智能体 AI 漫游指南》', location: '第 26 章 · PDF 463 至 494 页', note: '可靠性、测试、部署、扩展和持续迭代。' },
  ],
  'interaction-collaboration': [
    { title: '《深入理解 AI Agent》', location: '第 9 至 10 章 · PDF 248 至 294 页', note: '多模态、实时交互和多 Agent 协作。' },
    { title: '《智能体 AI 漫游指南》', location: '第 24 至 25、27 章 · PDF 422 至 462、495 至 514 页', note: 'A2A、多 Agent 架构和 Agentic UI。' },
  ],
};

const curatedPointDetails = {
  'Agent、Workflow、Chatbot、Copilot、Automation': '这些形态的差别落在控制权和执行深度。Chatbot 以回答为主，Copilot 给人建议，Workflow 按既定步骤运行，Automation 面向稳定规则，Agent 会根据观察自行选择下一步。系统可以组合使用它们，无需把所有能力都塞进 Agent Loop。',
  '目标、约束与完成定义': '目标说明要得到什么，约束限定可用资源和不可越过的边界，完成定义给出可检查的结束证据。三者缺一项，运行时就很难判断应该继续、暂停还是终止。',
  'Tokenization、Token 预算与 Context Window': '模型接收的是 Token 序列，Context Window 限制一次推理可见的总量，Token 预算还要在指令、历史、证据、工具结果和输出之间分配。窗口更长也可能让关键信息被大量内容稀释。',
  '文本、视觉、音频、视频与 Tool Use 能力': '模型能力要按输入模态、输出模态和可调用动作分别核对。能看图不代表能稳定定位界面元素，支持 Tool Use 也不代表会在业务约束下选对工具和参数。',
  '统一模型客户端与供应商适配层': '适配层把不同供应商的消息格式、工具调用、流式事件和错误码收口成内部协议。业务代码只依赖这个协议，模型切换、降级和计量才能集中完成。',
  '角色、目标、能力、限制与输出契约': '一份可执行的 Prompt 要同时交代角色、目标、可用能力、不可越过的限制，以及程序能够验证的输出形式。缺少输出契约时，措辞再清楚也难以稳定接入后续流程。',
  'Context 来源、作用域与优先级': '上下文可能来自系统指令、用户输入、任务状态、记忆、检索结果和工具返回。运行时要记录每段信息的来源、适用范围、时效和优先级，发生冲突时才有确定的处理依据。',
  'JSON Schema 与类型约束': 'JSON Schema 把模型输出从自由文本收紧为可验证的数据结构。它能限制字段、类型、枚举和嵌套关系，业务规则和跨字段约束仍需由程序继续校验。',
  '数据源、采集、解析、清洗与去重': 'RAG 的质量从数据进入系统时就已决定。采集负责覆盖，解析保留结构，清洗去掉噪声，去重避免同一证据反复占用召回位置，每一步都要保留来源和版本。',
  '倒排索引、向量索引与图索引': '倒排索引擅长精确词项，向量索引寻找语义相近内容，图索引沿实体和关系扩展证据。检索系统常把三者组合起来，再按查询类型决定权重。',
  'Context Packing 与证据排序': '检索片段送入模型前要完成去重、排序和预算分配。与问题最相关、来源最可靠、时效最合适的证据应靠近需要它的位置，避免低价值片段占满窗口。',
  'Working、Episodic、Semantic 与 Procedural Memory': 'Working Memory 服务当前步骤，Episodic Memory 保存发生过的事件，Semantic Memory 保存相对稳定的事实，Procedural Memory 保存做事方法。四类记忆的写入条件、检索方式和保留期应分别设计。',
  '写入条件与写入验证': '记忆写入要先判断信息是否值得长期保存，再核对来源、主体、时间和置信度。模型推断、临时状态和未经用户确认的偏好不应自动变成长期事实。',
  'Session、Task、Run、Step、Turn、Action 与 Observation': '这些对象描述不同粒度的运行过程。Session 容纳交互上下文，Task 表示用户目标，Run 是一次执行，Step 和 Turn 记录推进过程，Action 与 Observation 组成和环境交互的闭环。',
  '感知工具': '感知工具读取环境而不主动改变业务状态，例如搜索、查询、截图和文件读取。它们仍要受权限、数据范围和时效约束，读取成功也不代表信息完整可信。',
  '名称、用途、适用条件与禁用条件': 'Tool 描述要让模型知道它能做什么、何时应该调用、何时必须放弃。名称只负责识别，适用条件和禁用条件才决定工具会不会在错误场景中被滥用。',
  'Shell、REPL、Notebook 与代码执行沙箱': 'Shell 适合操作系统和工程任务，REPL 适合快速试算，Notebook 适合保留探索过程，沙箱负责限制文件、网络、进程和资源。运行形态不同，权限和复现要求也不同。',
  'MCP Host、Client 与 Server': 'Host 承载 AI 应用并管理用户授权，Client 在 Host 内维护一条协议连接，Server 暴露 Tool、Resource 和 Prompt。三者的进程位置可以变化，职责和信任边界不能混在一起。',
  'Model、Harness 与 Environment 的责任分配': 'Model 负责基于当前信息提出决策，Harness 负责组织上下文、执行工具、检查约束并处理恢复，Environment 保存真实状态和副作用。生产系统的可靠性大多来自后两者的工程实现。',
  'Queued、Running、Waiting、Paused 与终态': '状态机要区分尚未调度、正在执行、等待外部事件、人工暂停和已经结束。每个状态只接受有限事件，终态还要记录成功、失败、取消或部分完成的原因。',
  'Prompt Chaining': 'Prompt Chaining 把任务拆成固定的连续阶段，前一步产物经过检查后再进入下一步。它适合依赖关系明确的流程，每一段都容易测试和重跑。',
  '任务分解、依赖识别与计划生成': '计划先把目标拆成可验收的子任务，再标出依赖、可并行部分、外部等待和高风险动作。计划只是运行时假设，环境变化后应允许局部更新。',
  '同步请求、异步任务与事件驱动任务': '同步请求适合短时且调用方需要立即结果的工作，异步任务把执行与请求生命周期分开，事件驱动任务在外部条件满足后继续。选择时要看耗时、等待点和恢复要求。',
  '领域模型与统一术语': '领域模型把 Task、Run、Step、Artifact、Approval 等核心对象及其关系固定下来。团队用同一套词描述状态和责任，接口、日志、评测与页面才不会各说一套。',
  '最终结果、执行轨迹与中间状态': '最终结果回答任务是否完成，执行轨迹记录模型与工具怎样推进，中间状态保存恢复和归因所需的节点。三者要分开评，结果碰巧正确时，轨迹仍可能包含越权或不可重复的步骤。',
  '真实失败、人工精选、黄金样本与合成数据': '真实失败保留生产分布，人工精选保证代表性，黄金样本提供稳定判定标准，合成数据补齐罕见边界。评测集要记录来源和版本，避免同一案例在训练与测试中重复出现。',
  '任务成功率与完成质量': '任务成功率统计是否达到完成条件，完成质量进一步衡量正确性、完整性和产物可用性。二者要有明确评分口径，高风险任务还应单独统计严重失败。',
  'Golden Output 与 Golden Trajectory': 'Golden Output 给出可接受的结果样例，Golden Trajectory 还约束关键步骤、工具选择和安全边界。开放式任务可以允许多种正确输出，关键行为仍能用轨迹断言检查。',
  'Trace、Log、Metric、Event 与 Artifact': 'Trace 串起一次请求的因果路径，Log 记录离散事实，Metric 聚合趋势，Event 驱动状态变化，Artifact 保存可交付产物。混用这些记录会让调试、告警和审计都失去清晰口径。',
  'Pretraining、SFT 与 Instruction Tuning': 'Pretraining 学习通用语言和世界模式，SFT 用示范轨迹塑造任务行为，Instruction Tuning 让模型更稳定地遵循多类指令。后两者能改进行为习惯，真实副作用仍需 Harness 约束。',
  '资产、身份、信任边界、攻击面与滥用场景': '威胁建模先列出要保护的资产和参与主体，再画清数据与权限跨越的信任边界。每个入口、工具、检索源和 Agent 消息都可能成为攻击面，最后用具体滥用路径验证防护。',
  '身份认证、主体绑定与代理身份': '系统既要确认真实用户，也要记录 Agent 代表谁执行动作。代理身份应绑定委托范围和有效期，审计记录必须能追溯到最终责任主体。',
  '输入 Schema、业务校验、输出校验与 Policy Engine': '输入 Schema 检查结构，业务校验检查领域规则，输出校验核对工具结果，Policy Engine 根据主体、资源和风险作最终决策。这些确定性检查应位于模型之外。',
  'PII 识别、数据最小化、用户同意与目的限定': '处理个人信息前要确认数据类别、使用目的和用户授权，只收集完成任务所需的最少内容。日志、记忆、评测集和第三方工具都要继承同一范围。',
  'API Gateway、Agent Service、Queue、Worker 与 Scheduler': 'Gateway 处理入口和身份，Agent Service 管理任务，Queue 缓冲与解耦，Worker 执行步骤，Scheduler 负责时间和资源调度。长任务依靠持久状态在这些组件之间转移。',
  '超时、重试预算、熔断、Bulkhead 与降级': '超时限制单次等待，重试预算限制额外流量，熔断阻止持续调用故障依赖，Bulkhead 隔离资源池，降级保留核心能力。它们要按整条调用链共同计算。',
  '租户命名空间、数据隔离与资源隔离': '命名空间解决对象归属，数据隔离防止越权读取，资源隔离限制一个租户拖垮全局服务。三层都要覆盖模型调用、工具、存储、队列和日志。',
  'Config Center、Prompt Registry 与 Model Allowlist': 'Config Center 管运行参数，Prompt Registry 保存提示版本和评测证据，Model Allowlist 限制可上线的模型及其区域和能力。一次 Run 应能反查当时使用的全部配置。',
  'SLI、SLO、SLA 与 Error Budget': 'SLI 是实际测量值，SLO 是内部可靠性目标，SLA 是对外承诺，Error Budget 表示可容忍的失败空间。Agent 系统还要把语义质量、成本和安全纳入指标。',
  'Chat、Artifact、Canvas、Workflow 与 Dashboard': 'Chat 适合对话，Artifact 承载可交付内容，Canvas 支持共同编辑，Workflow 展示步骤与依赖，Dashboard 汇总状态和风险。界面应按任务形态组合这些容器。',
  '文本、图像、音频、视频与传感器输入': '多模态输入要同时保存原始信号、解析结果、时间关系和来源。模型看到的描述只是环境的一种表示，关键动作还需回到原始画面、音频或传感器数据核验。',
  '单 Agent 优先与多 Agent 启用条件': '单 Agent 的上下文和责任最清楚。只有专业能力隔离、权限隔离、并行收益或上下文容量带来可测提升时，才值得引入多个 Agent。',
  '结构化消息与 Schema 版本': 'Agent 间消息要明确发送者、接收者、任务、状态、产物引用和关联 ID，并用 Schema 版本控制演进。自由文本可以补充说明，不能承担关键状态同步。',
  '接口不清、目标不一致与责任漂移': '协作失败常从接口和所有权开始。输入输出含糊会引发返工，目标口径不同会产生冲突，最终责任无人承担时，多个 Agent 只会把问题继续转交。',
  'Tool、MCP、Skill 与 Agent 的边界': 'Tool 是一次可调用动作，MCP 规定 Host 与外部能力怎样连接，Skill 把指令、知识、脚本和工具组织成可复用能力，Agent 负责在目标和环境反馈下选择行动。四者处在不同层级。',
  '框架抽象泄漏、锁定、升级与退出策略': '框架特有的状态对象、回调和序列化格式一旦进入业务层，替换成本就会迅速上升。关键运行对象应使用内部接口表达，同时保留数据导出、版本兼容和迁移验证。',
  'Trace 采样、脱敏、加密、保留、删除与访问控制': 'Trace 可能包含 Prompt、工具参数、业务数据和个人信息。采样决定保存哪些运行，脱敏与加密控制泄漏风险，保留、删除和访问策略则要跟随数据类别与用户授权。',
  'FSDP、Tensor Parallel 与 Pipeline Parallel': 'FSDP 切分参数、梯度与优化器状态，Tensor Parallel 切分单层张量计算，Pipeline Parallel 把不同层分配到多个阶段。选型要看模型大小、网络带宽、批量和流水线气泡。',
  'CPU、内存、磁盘、进程、时间与请求限制': '沙箱要分别限制 CPU 时间、内存、磁盘、子进程、墙钟时间和外部请求。任何一项没有上限，Agent 生成的代码或工具调用都可能耗尽共享资源。',
  '法务、合规与供应商退出计划': '生产 Agent 依赖模型、搜索、向量库和工具供应商。合同与合规评估要覆盖数据用途、驻留、保留、审计和服务终止，退出计划还要验证数据导出、替代方案和迁移时间。',
};

const curatedPointChecks = {
  'Trace 采样、脱敏、加密、保留、删除与访问控制': {
    pitfall: '为了排错保存每条完整 Trace，会同时扩大存储成本、敏感数据暴露和内部访问风险。',
    verify: '抽查一条含个人信息的 Trace，验证采样、字段脱敏、加密、到期删除和访问审计。',
  },
  'FSDP、Tensor Parallel 与 Pipeline Parallel': {
    pitfall: '只按显存是否放得下选择并行方式，容易忽略通信开销、负载不均和 Pipeline 气泡。',
    verify: '固定模型与数据，比较不同并行组合的吞吐、显存、通信时间和故障恢复。',
  },
  '法务、合规与供应商退出计划': {
    pitfall: '合同结束后才考虑迁移，常会发现数据无法完整导出、接口被专有格式锁住，或替代服务不满足区域要求。',
    verify: '做一次供应商退出演练，计时完成数据导出、配置迁移、替代服务切换和删除证明。',
  },
};

const pointLenses = [
  {
    test: /注入|越权|权限|认证|授权|凭据|Secret|PII|隐私|隔离|Allowlist|Guardrail|Policy|攻击|滥用|泄漏|审计|同意|信任边界|Jailbreak|Confused Deputy|Privilege Escalation|高风险动作|二次确认|Side Effect Ledger|副作用核验|CPU、内存|请求限制/,
    detail: (title) => `${title}要沿主体、资源、动作和数据流逐段检查。控制措施要在模型调用前后都能生效，并留下可追溯证据。`,
    pitfall: (title) => `只在 Prompt 中提醒模型遵守${title}，遇到恶意输入或工具副作用时仍可能失守。`,
    verify: (title) => `为${title}写一个正常案例和两个越界案例，确认确定性策略能阻断并记录原因。`,
  },
  {
    test: /评测|指标|成功率|准确率|Recall|Precision|MRR|nDCG|Pass@|Pass\^|Grader|Judge|Rubric|显著性|置信区间|样本量|A\/B|回归|Golden|Benchmark|SLO|SLI|SLA|Error Budget|Safety、Cost|Human-interaction Environment|Simulation Environment|对抗数据|留出集|Paired Comparison|消融实验|语义错误|程序异常|自举|漂移|反馈污染|PPO|DPO|GRPO|Reward|Trajectory|Rollout|Credit Assignment|Offline RL|Online RL|On-policy|Off-policy|Curriculum|Self-play|训练污染|安全对齐/,
    detail: (title) => `${title}必须先固定计算口径、样本范围和通过阈值。结果要能回到具体样本与 Trace，平均值之外还要观察高风险失败。`,
    pitfall: (title) => `口径未锁定就比较${title}，模型、数据或裁判变化都会制造虚假的提升。`,
    verify: (title) => `选一组固定样本计算${title}，手工复核边界结果，并记录版本与置信范围。`,
  },
  {
    test: /状态|生命周期|写入|更新|合并|删除|遗忘|恢复|重放|分叉|Fork|Rollback|Pause|Resume|Cancel|Queued|Running|Waiting|Checkpoint|Snapshot|TTL|保留期|终止/,
    detail: (title) => `${title}应表现为显式状态、触发事件和允许的转移。每次变化要说明所有者、持久化位置、并发规则和失败后的恢复点。`,
    pitfall: (title) => `只保存当前值而不保存版本和转移原因，${title}在并发或重启后很难还原。`,
    verify: (title) => `画出${title}的状态转移图，注入重复事件、进程重启和并发更新。`,
  },
  {
    test: /Schema|契约|参数|类型|枚举|字段|结构化|JSON|Function Calling|Tool Choice|协议|JSON-RPC|HTTP|gRPC|消息|Agent Card|Request-Response|Streaming|Pub-Sub|Push Notification|归一化|流式输出|中断传播|初始化|能力协商|重连|关闭/,
    detail: (title) => `${title}把模型输出和外部系统之间的约定写成机器可检查的接口。还要定义版本、错误、缺字段和不兼容输入的处理。`,
    pitfall: (title) => `接口文档只覆盖成功样例时，${title}会在半包、旧版本或异常返回中失去约束。`,
    verify: (title) => `为${title}准备合法、边界、缺失和冲突四类契约测试。`,
  },
  {
    test: /超时|重试|熔断|背压|限流|并发|配额|幂等|去重|DLQ|乱序|重复|故障|回退|降级|补偿|Saga|Outbox|事务|一致性|资源清理|租约|心跳|Bulkhead|热点|惊群|级联失败|部分可用|健康检查|监控|告警|值班/,
    detail: (title) => `${title}处理正常路径之外的运行语义。设计时要回答能否重试、是否已经产生副作用、怎样去重，以及最终状态由谁确认。`,
    pitfall: (title) => `各层独立实现${title}却没有统一预算和业务键，容易形成重复副作用或故障放大。`,
    verify: (title) => `围绕${title}注入超时、响应丢失、重复请求和部分成功，核对最终业务状态。`,
  },
  {
    test: /RAG|检索|索引|Embedding|BM25|Dense|Hybrid|Reranker|Query|HyDE|Top-k|证据|引用|Groundedness|Faithfulness|Answer Relevance|分块|数据源|血缘|新鲜度|Reciprocal Rank Fusion|Metadata|ACL|Tenant|Time Filter|无依据|拒答/,
    detail: (title) => `${title}位于查询到证据的链路中。要保留来源、版本、权限和时间信息，并区分召回不足、排序错误与生成阶段的误用。`,
    pitfall: (title) => `只凭最终回答判断${title}，会把检索失败和模型编造混成同一类问题。`,
    verify: (title) => `用可定位原文的问题检查${title}，逐段核对召回、排序、引用和拒答。`,
  },
  {
    test: /Memory|记忆|用户偏好|原子事实|事件摘要|巩固|反思|用户级|组织级|共享记忆|冷存储/,
    detail: (title) => `${title}要带上来源、主体、作用域、时间和置信度。写入与读取分开治理，过期、冲突和用户删除都有明确路径。`,
    pitfall: (title) => `把模型推断直接写入${title}，一次错误就可能在后续任务中反复出现。`,
    verify: (title) => `为${title}构造冲突、过期、跨用户和删除案例，检查读取结果与审计记录。`,
  },
  {
    test: /Context|Prompt|上下文|指令|摘要|截断|窗口|KV Cache|状态栏|TODO|工具结果|缓存/,
    detail: (title) => `${title}决定模型在当前决策点能看到什么。需要标明信息来源、优先级、预算和时效，并验证删减或重排后是否影响任务完成。`,
    pitfall: (title) => `把更多内容都塞进上下文不会自动改善${title}，关键规则可能被噪声稀释。`,
    verify: (title) => `记录一次 Run 中${title}占用的内容和 Token，做删减实验并比较结果。`,
  },
  {
    test: /Trace|Log|Metric|Event|Artifact|Span|Run ID|Correlation ID|Dashboard|Alert|可观测|采样|脱敏|回放|调试/,
    detail: (title) => `${title}负责把一次运行变成可查询的证据。记录要带关联标识、组件版本、时间和主体，既支持定位首错，也要控制敏感数据。`,
    pitfall: (title) => `只有最终文本和零散日志时，${title}无法还原模型、工具与状态之间的因果关系。`,
    verify: (title) => `从一个失败请求出发，用${title}定位首个偏离步骤并复现同类问题。`,
  },
  {
    test: /语音|音频|视频|图像|视觉|VAD|ASR|TTS|全双工|多模态|Screen|Computer Use|Robotics|VLA|传感器|实时|抖动|打断/,
    detail: (title) => `${title}要把感知、推理、反馈和动作放进同一条时间线。除模型能力外，还要处理定位误差、网络延迟、用户打断和环境变化。`,
    pitfall: (title) => `只测模型输出会低估${title}的端到端延迟和动作失败。`,
    verify: (title) => `录制一次${title}的完整时序，加入噪声、打断和界面变化后检查恢复。`,
  },
  {
    test: /多 Agent|Agent 间|Reviewer|Supervisor|Worker|Specialist|委派|协作|共享上下文|独立上下文|A2A|消息总线|Artifact 交接|责任|角色|跨组织|跨信任域|不可信 Agent/,
    detail: (title) => `${title}要明确任务所有权、上下文边界、权限和交接产物。增加一个 Agent 的收益应由并行、专业化或隔离效果证明。`,
    pitfall: (title) => `角色数量增加后仍共享全部上下文和权限，${title}只会放大协调成本与错误传播。`,
    verify: (title) => `用同一任务比较单 Agent 和${title}方案，检查成功率、耗时、成本与责任归属。`,
  },
  {
    test: /UI|Chat|Canvas|Workflow|进度|通知|用户|审批|人工|Ask User|Clarification|接管|无障碍|读屏|键盘|来源|不确定性/,
    detail: (title) => `${title}要帮助用户理解当前状态、下一步动作和介入位置。界面需区分运行中、等待、失败、部分成功和已产生副作用。`,
    pitfall: (title) => `界面只呈现自然语言结果时，${title}缺少状态、证据和恢复入口。`,
    verify: (title) => `用长任务、审批超时和部分成功场景走查${title}，确认键盘与读屏也能感知变化。`,
  },
  {
    test: /成本|预算|计量|计费|用量|价格|TTFT|延迟|容量|队列深度|弹性|扩展|多租户|区域|边缘|资源/,
    detail: (title) => `${title}把资源消耗和任务价值放在同一口径下。预算要能按租户、任务和步骤归集，并在接近上限时触发降级或停止。`,
    pitfall: (title) => `只记录模型费用会漏掉${title}涉及的工具、存储、网络和失败重试。`,
    verify: (title) => `为一次完整 Run 核算${title}，再模拟流量峰值检查限额和降级。`,
  },
  {
    test: /版本|迁移|发布|回滚|Registry|Allowlist|Feature Flag|Canary|Shadow|CI|配置|兼容|弃用|供应商|模型选择|能力注册|路由/,
    detail: (title) => `${title}要让线上行为变化可追踪、可比较、可撤回。代码之外，模型、Prompt、Tool、Schema、Skill 和数据集都属于版本对象。`,
    pitfall: (title) => `只记录应用提交号时，${title}无法解释模型别名或外部依赖变化造成的回退。`,
    verify: (title) => `从一条 Trace 反查${title}涉及的版本，再演练灰度失败和回滚。`,
  },
  {
    test: /Tool|工具|Shell|REPL|Notebook|文件|代码|浏览器|桌面|设备|沙箱|MCP|Skill|API|SDK|Read-only|Destructive|Idempotent|Open-world|编译|静态分析|运行结果/,
    detail: (title) => `${title}把模型的决定转成可执行动作。设计时要写清输入输出、权限、副作用、错误语义、超时和可恢复方式。`,
    pitfall: (title) => `只验证调用成功会掩盖${title}的参数错误、权限越界和业务副作用。`,
    verify: (title) => `为${title}跑契约测试、权限测试和故障注入，并核对执行证据。`,
  },
  {
    test: /模型|Model|LLM|Transformer|Attention|Embedding|Temperature|Top-p|Seed|推理|采样|幻觉|Structured Output|端侧|FSDP|Tensor Parallel|Pipeline Parallel/,
    detail: (title) => `${title}要放在具体任务和评测集里判断。能力会受版本、采样、上下文、供应商实现和输入分布影响，不能从单次输出外推。`,
    pitfall: (title) => `依据榜单或一次演示判断${title}，容易忽略真实任务中的波动和降级路径。`,
    verify: (title) => `固定样本和参数评测${title}，重复运行并记录质量、延迟、成本和失败类型。`,
  },
  {
    test: /工作流|Workflow|Loop|循环|计划|规划|执行|编排|Routing|Parallel|Orchestrator|ReAct|Evaluator|状态机|步骤|任务|依赖|停止|运行时|Harness|Plan-and-Execute|Reflection|Self-Critique|Reflexion|自洽投票|修复范围|外部事件订阅|唤醒|取消订阅|关联 ID|因果链|事件溯源/,
    detail: (title) => `${title}要落实成清楚的输入、步骤、转移条件和终止规则。概率性判断负责选择，状态更新和副作用执行仍由运行时控制。`,
    pitfall: (title) => `流程只存在于模型的自然语言计划中，${title}就难以暂停、恢复和审计。`,
    verify: (title) => `把${title}画成状态与事件图，测试失败、取消、超预算和恢复路径。`,
  },
  {
    test: /架构|服务|Gateway|Queue|Scheduler|Store|Control Plane|Data Plane|接口|依赖倒置|领域模型|拓扑|框架|Python|Java/,
    detail: (title) => `${title}关注组件职责和变化隔离。稳定领域接口应包住模型供应商、工具协议、存储和框架，让替换影响停留在边界内。`,
    pitfall: (title) => `把外部框架对象直接带入业务层，${title}会在升级或替换时产生大面积修改。`,
    verify: (title) => `替换${title}中的一个外部实现，检查业务接口、数据迁移和回归范围。`,
  },
  {
    test: /适用条件|反模式|规则引擎|传统自动化|自主等级|控制权|Observation|Action Space|开放世界|封闭世界|能力探测|变化检测|领域词汇|运行对象|Zero-shot|Few-shot|正例|反例|边界样例/,
    detail: (title) => `${title}用于划清系统该如何选择和行动。理解时要写出适用前提、可观察信息、允许动作和需要交还控制权的条件。`,
    pitfall: (title) => `把${title}当成名词分类，却没有落到真实任务的选择条件和责任边界。`,
    verify: (title) => `为${title}准备两个相反案例，说明系统为什么采用不同方案。`,
  },
];

export function buildPointProfile(title, guide, existingDetail) {
  const lens = pointLenses.find((entry) => entry.test.test(title));
  const curatedDetail = existingDetail ?? curatedPointDetails[title];
  const inlineTitle = ` ${title} `;
  const clean = (value) => value
    .replace(/([\u3400-\u9fff])\s+([\u3400-\u9fff])/g, '$1$2')
    .replace(/\s+([，。；])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const detail = curatedDetail ?? lens?.detail(inlineTitle, guide)
    ?? `理解${title}时，要把它放回一次真实运行，确认它读取什么信息、改变什么状态、留下什么证据，以及失败后由谁接手。`;
  const checks = curatedPointChecks[title];

  return {
    detail: clean(detail),
    pitfall: clean(checks?.pitfall ?? (curatedDetail ? guide.pitfall : lens?.pitfall(inlineTitle, guide)) ?? `只记住 ${title} 的名词定义，却没有把它放进系统边界和失败路径中。`),
    verify: clean(checks?.verify ?? (curatedDetail ? guide.verify : lens?.verify(inlineTitle, guide)) ?? `选一个真实任务解释 ${title} 的输入、输出、责任主体和失败处理，再用一条 Trace 或测试证明。`),
  };
}
