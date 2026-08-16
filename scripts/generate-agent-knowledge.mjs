import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { bookRoutes, buildPointProfile } from './agent-knowledge-content.mjs';

const sourcePath = resolve('素材/课程整理/AI-Agent-系统运行全景图.md');
const outputPath = resolve('src/data/agent-knowledge.json');

const domainMeta = [
  { id: 'foundations', code: '01', short: '基础与边界' },
  { id: 'model-context', code: '02', short: '模型与上下文' },
  { id: 'knowledge-state', code: '03', short: '知识与状态' },
  { id: 'tools-environment', code: '04', short: '工具与环境' },
  { id: 'runtime-orchestration', code: '05', short: '运行时与编排' },
  { id: 'evaluation-evolution', code: '06', short: '评测与演进' },
  { id: 'safety-governance', code: '07', short: '安全与治理' },
  { id: 'production-platform', code: '08', short: '生产平台' },
  { id: 'interaction-collaboration', code: '09', short: '交互与协作' },
];

const groupGuides = {
  'Agent 概念与选型': {
    summary: '判断一个问题需要确定性流程、模型判断还是持续行动，并据此选择 Agent 的自主程度。',
    pitfall: '看到自然语言输入就使用 Agent，容易把稳定业务规则交给概率模型。',
    verify: '拿一个真实需求分别画出普通代码、Workflow 和 Agent 三种方案，说明每种方案的成本与失败边界。',
  },
  '任务定义': {
    summary: '把模糊目标拆成可执行任务，让成功、失败、预算和停止条件都能被系统判断。',
    pitfall: '只有目标，没有完成定义和终止条件，Agent 很容易提前结束或无限循环。',
    verify: '为一个长任务写出验收条件、预算、阶段产物和停止规则，再用失败样例检查它们是否可判定。',
  },
  'Agent 与环境': {
    summary: '明确 Agent 能观察什么、能做什么，以及外部世界怎样把变化反馈给运行时。',
    pitfall: '把环境状态当成模型上下文的一部分，会遗漏权限、并发和真实副作用。',
    verify: '为一个 Agent 画出 Observation、Action、Environment State 和 Feedback，标出每条边的可信度。',
  },
  'LLM 应用直觉': {
    summary: '掌握模型输入、生成和上下文限制，理解概率输出如何影响应用行为。',
    pitfall: '把一次模型输出当成稳定函数结果，忽略版本、采样和上下文变化。',
    verify: '固定输入后改变模型版本、采样参数和上下文长度，比较输出稳定性、延迟与成本。',
  },
  '模型能力与选择': {
    summary: '按任务所需能力、质量、延迟、成本和风险选择模型，并保留降级路径。',
    pitfall: '只看单一榜单或最大模型，容易忽略 Tool Use、结构化输出和区域限制。',
    verify: '为三类真实任务建立能力矩阵，用同一评测集比较候选模型和降级模型。',
  },
  'Model Gateway': {
    summary: '把不同模型供应商收口到稳定接口，集中处理路由、计量、重试和故障切换。',
    pitfall: '业务代码直接依赖某个 SDK，会让模型切换、配额治理和观测变得困难。',
    verify: '模拟主供应商超时和限流，检查路由、重试预算、熔断与成本记录。',
  },
  'Prompt Engineering': {
    summary: '用清晰指令、示例和输出契约约束单次模型行为，并对版本变化做回归验证。',
    pitfall: '把业务规则堆进一个长 Prompt，却没有版本、测试和信任边界。',
    verify: '建立正常、边界和对抗样例，比较 Prompt 变更前后的行为与失败类型。',
  },
  'Context Engineering': {
    summary: '决定运行时把哪些信息、以什么顺序和预算交给模型。',
    pitfall: '把所有历史和工具输出全部塞入上下文，会稀释关键规则并增加成本。',
    verify: '记录一次真实 Run 的上下文组成，删减或压缩各部分后比较任务成功率。',
  },
  '模型输入输出契约': {
    summary: '让模型输出进入程序前具有可校验的结构、类型和失败处理方式。',
    pitfall: '只要求模型返回 JSON，却不做 Schema 校验、修复限制和拒绝策略。',
    verify: '用缺字段、错类型、截断和流式半包测试结构化输出解析器。',
  },
  'RAG 数据工程': {
    summary: '把原始资料变成带来源、版本、权限和更新时间的可检索数据。',
    pitfall: '只关注向量库，忽略解析质量、删除传播和权限元数据。',
    verify: '从源文档到索引抽查数据血缘，验证新增、修改、删除和权限变化都能传播。',
  },
  '检索与排序': {
    summary: '让查询在多个检索器和过滤条件中找到足够相关且有权限的证据。',
    pitfall: '固定使用向量 Top-k，遇到专有名词、时效要求和精确匹配时容易漏召回。',
    verify: '用同一查询集比较 BM25、Dense、Hybrid 和 Reranker 的 Recall@k 与 nDCG。',
  },
  '生成与证据': {
    summary: '让最终回答能回到原始证据，并区分检索失败和生成失败。',
    pitfall: '有引用链接却没有句子级证据对齐，仍可能出现错误归因。',
    verify: '逐条核对回答中的事实、引用位置和版本，加入无结果问题测试拒答行为。',
  },
  'Memory 模型': {
    summary: '区分工作记忆、事件经历、稳定事实和操作经验，避免把所有历史塞进一个存储。',
    pitfall: '把 Log、任务状态和用户事实混在一起，会造成错误召回和隐私越界。',
    verify: '为会话、任务、用户和组织分别定义记忆类型、作用域、来源和读取者。',
  },
  'Memory 生命周期': {
    summary: '控制记忆何时写入、怎样更新、何时遗忘，以及错误记忆如何被纠正。',
    pitfall: '未经验证就长期保存模型推断，会把一次幻觉固化成用户事实。',
    verify: '构造冲突事实、过期事实和删除请求，检查写入、合并、衰减与删除路径。',
  },
  '运行状态与产物': {
    summary: '把任务过程拆成可持久化的状态和产物，为恢复、审计和分叉提供依据。',
    pitfall: '只保存聊天消息，进程重启后无法还原正在执行的步骤和外部副作用。',
    verify: '在多个步骤中断 Worker，检查状态、Artifact 和 Checkpoint 能否恢复到正确位置。',
  },
  'Tool 类型': {
    summary: '按感知、执行、协作、事件和用户沟通等职责划分工具，明确调用方式与副作用。',
    pitfall: '把异步事件或用户追问硬塞进普通同步工具，运行时会失去等待和唤醒语义。',
    verify: '盘点现有工具，为每个工具标出类型、同步方式、副作用和调用主体。',
  },
  'Tool 契约': {
    summary: '用 Schema、错误语义、能力标注和版本约束模型可以怎样调用工具。',
    pitfall: '工具描述只写接口名称，模型难以判断适用条件、禁用条件和失败后动作。',
    verify: '对每个 Tool 做契约测试，覆盖合法输入、边界值、权限失败和版本兼容。',
  },
  'Tool 执行可靠性': {
    summary: '让工具调用在重复、超时、并发和部分失败时仍能恢复到可解释状态。',
    pitfall: '网络超时后直接重试副作用操作，可能造成重复扣款、重复发送或状态覆盖。',
    verify: '注入重复请求、响应丢失和并发冲突，核对幂等键、补偿动作与副作用账本。',
  },
  '代码与计算机环境': {
    summary: '让 Agent 通过代码、文件系统、浏览器和桌面界面处理开放式数字任务。',
    pitfall: '给 Agent 完整主机权限，却没有沙箱、环境快照和变更验证。',
    verify: '在隔离环境中完成一次仓库修改或浏览器任务，检查补丁、测试、截图与回滚证据。',
  },
  'MCP 与 Skills': {
    summary: '用标准协议暴露外部能力，用 Skill 封装可复用的工作方法和本地资源。',
    pitfall: '把 Tool、MCP Server、Skill 和独立 Agent 当成同一层抽象，权限边界会变得含糊。',
    verify: '为一个能力分别画出 Host、Client、Server、Tool 和 Skill 的职责与授权流程。',
  },
  'Harness 职责': {
    summary: '由运行时管理上下文、工具、约束、验证和纠错，把模型放进可控执行环境。',
    pitfall: '让模型自己承担状态、权限和停止判断，系统行为难以恢复和审计。',
    verify: '把一次 Agent Run 拆成模型决定和 Harness 决定，检查每项职责是否有确定归属。',
  },
  '状态机与执行循环': {
    summary: '用显式状态和转移规则控制 Agent 从开始、等待到终止的整个过程。',
    pitfall: '循环只靠 while 和异常退出，无法准确处理暂停、取消和部分成功。',
    verify: '为每种状态列出允许事件和非法转移，再测试取消、审批超时和 Worker 重启。',
  },
  '工作流模式': {
    summary: '根据任务结构选择串联、路由、并行、编排或生成验证循环。',
    pitfall: '所有任务都套用同一种 Agent Loop，会引入多余步骤和不可预测性。',
    verify: '给三个不同任务选择工作流模式，并说明数据依赖、并行点和终止器。',
  },
  '规划、验证与修复': {
    summary: '让 Agent 能拆解任务、检查结果并在明确范围内修复或重新规划。',
    pitfall: '验证失败后从头重跑，既浪费预算，也可能重复已经发生的副作用。',
    verify: '构造中间步骤失败，检查系统能否定位失败范围并选择重试、修复、回退或升级。',
  },
  '事件驱动与持久执行': {
    summary: '让长任务跨越进程重启、外部事件和人工等待，保持可恢复的执行进度。',
    pitfall: '把长任务维持在一个 HTTP 请求或内存协程中，重启后会失去状态。',
    verify: '在等待 Webhook、审批和定时器期间重启服务，检查任务只恢复一次并保持因果顺序。',
  },
  '软件架构与框架选择': {
    summary: '围绕稳定领域接口组织 Agent 系统，让模型、工具和框架可以替换。',
    pitfall: '直接把框架对象扩散到业务层，升级或更换框架时修改范围会失控。',
    verify: '替换一个 Model Provider 或 Tool Backend，统计业务层需要修改的接口数量。',
  },
  '评测对象与环境': {
    summary: '明确要评最终结果、执行轨迹还是单个组件，并为它提供可重复的测试环境。',
    pitfall: '只评最后一句回答，会漏掉错误工具调用、越权动作和浪费步骤。',
    verify: '为一个任务同时设计结果、轨迹、工具、安全、成本和交互层评测。',
  },
  '评测数据': {
    summary: '建立来源清楚、覆盖真实失败且能长期回归的数据集。',
    pitfall: '只使用合成正常样例，生产中的边界、对抗和恢复问题不会暴露。',
    verify: '检查数据来源、难度、版本、重复样本和污染，并加入真实失败与轨迹前缀。',
  },
  '指标与 Grader': {
    summary: '用适合任务的指标和裁判判断能力上限、连续可靠性和过程质量。',
    pitfall: '只看平均分，可能掩盖连续任务中的失败概率和高风险尾部。',
    verify: '同时计算 Pass@k、Pass^k、成本和安全指标，并用人工样本校准 LLM Judge。',
  },
  '回归与实验': {
    summary: '用可对照的实验确认 Prompt、模型或 Harness 变更带来的真实影响。',
    pitfall: '一次修改同时更换多个变量，结果变化无法归因。',
    verify: '使用固定数据、双 Feature Flag 和成对比较，报告置信区间与回滚条件。',
  },
  '可观测性与调试': {
    summary: '记录模型、工具、检索、记忆和状态转移，使一次运行可以定位、比较和重放。',
    pitfall: '只有文本日志，没有版本和关联 ID，跨组件失败无法串起来。',
    verify: '从一个用户请求追到所有 Span、版本、重试和副作用，再用 Trace 重放复现问题。',
  },
  '持续演进': {
    summary: '把生产失败和用户反馈转成经过验证的知识、Prompt、代码或模型更新。',
    pitfall: 'Agent 直接依据自己的运行结果修改生产规则，会放大错误和反馈污染。',
    verify: '为四种更新载体分别定义样本来源、评测门禁、灰度范围、审批和回滚。',
  },
  '模型后训练与 Agent RL': {
    summary: '用示范、偏好和轨迹奖励调整模型，使其更适合工具使用和长时程任务。',
    pitfall: '奖励函数只看最终分数，模型可能通过投机行为获得高分。',
    verify: '检查数据污染、Credit Assignment、奖励黑客和离线到在线的分布变化。',
  },
  '威胁模型': {
    summary: '从资产、主体、信任边界和攻击面出发，列出 Agent 可被操纵或滥用的路径。',
    pitfall: '只过滤用户 Prompt，会遗漏网页、RAG、工具输出和多 Agent 消息中的间接注入。',
    verify: '对一次端到端任务做数据流图和滥用案例，覆盖输入、检索、工具、记忆和输出。',
  },
  '身份、权限与审批': {
    summary: '确认谁在委托 Agent、Agent 代表谁行动，以及每次动作能使用哪些临时权限。',
    pitfall: '把用户长期凭据放进 Prompt 或共享给所有工具，会扩大泄漏和越权范围。',
    verify: '用只读、可逆、高风险三类动作测试 Scope、审批、超时和撤销。',
  },
  '隔离与 Guardrail': {
    summary: '在模型之外用确定性策略、资源限制和沙箱约束输入、执行与副作用。',
    pitfall: 'Guardrail 只做输出内容审核，无法阻止进程、文件和网络层越权。',
    verify: '尝试越界文件访问、外连、命令注入和资源耗尽，确认系统在执行前阻断。',
  },
  '隐私、审计与事故处理': {
    summary: '控制敏感数据的使用和保留，并在事故发生后还原责任主体与影响范围。',
    pitfall: '为了调试保存完整 Prompt 和工具结果，可能长期保留凭据与个人数据。',
    verify: '执行一次数据导出、删除和事故演练，检查日志脱敏、访问记录和恢复验证。',
  },
  '服务与存储拓扑': {
    summary: '把入口、运行时、队列、Worker 和不同状态存储组合成可部署的 Agent 服务。',
    pitfall: '所有状态都放进同一个数据库表，生命周期、查询模式和恢复要求难以满足。',
    verify: '画出控制面和数据面，标明每类任务、状态、产物和 Trace 的存储与所有者。',
  },
  '可靠性与扩展': {
    summary: '在供应商故障、流量峰值和队列积压时保持核心任务可用并限制级联失败。',
    pitfall: '每层都独立重试，组合后会产生重试风暴。',
    verify: '注入模型超时、队列积压和存储故障，观察背压、熔断、降级与恢复。',
  },
  '多租户与成本': {
    summary: '隔离租户数据和资源，把模型、工具与存储消耗归到明确主体。',
    pitfall: '只限制 API 请求数，无法控制一次请求内部的 Token 和工具循环。',
    verify: '让两个租户同时触发高成本任务，检查配额、公平调度、硬终止和账单归因。',
  },
  '配置、版本与发布': {
    summary: '让 Prompt、模型、工具、策略和数据集的每次变更都能比较、灰度和回滚。',
    pitfall: '只记录应用代码版本，线上行为变化却来自 Prompt 或模型别名更新。',
    verify: '从一条生产 Trace 反查全部版本，并演练 Canary 失败后的完整回滚。',
  },
  '运行保障': {
    summary: '用 SLO、告警、值班和恢复演练维持生产 Agent 的长期运行。',
    pitfall: '只监控服务是否存活，语义失败和成本异常会长期无人发现。',
    verify: '为质量、延迟、成本和安全分别定义 SLI，并用一次故障演练检查 Runbook。',
  },
  'Agentic UI': {
    summary: '把目标、进度、工具动作、证据和恢复入口呈现给用户，让运行过程可理解。',
    pitfall: '只显示持续生成的文字，用户无法判断 Agent 正在等待、失败还是产生副作用。',
    verify: '用长任务、部分成功和审批超时检查状态、通知、来源与恢复入口。',
  },
  '人机协同': {
    summary: '在需要判断、授权或补充信息的位置把控制权交给用户，并支持继续执行。',
    pitfall: '审批弹窗只显示动作名称，没有参数、影响范围和撤销能力。',
    verify: '测试追问、编辑后批准、拒绝、超时、人工接管和异步恢复。',
  },
  '多模态与实时交互': {
    summary: '处理语音、视觉和设备输入，在实时反馈与深度推理之间安排延迟预算。',
    pitfall: '只优化模型响应时间，却忽略 VAD、网络抖动、TTS 和动作反馈的总延迟。',
    verify: '记录端到端时序，测试打断、噪声、屏幕变化和动作失败后的恢复。',
  },
  '多 Agent 架构': {
    summary: '在确有权限、上下文或并行需求时拆分角色，并保持任务所有权清楚。',
    pitfall: '为了展示复杂度而增加 Agent，会带来上下文转交、协调和评测成本。',
    verify: '比较单 Agent 与多 Agent 基线，确认成功率或隔离收益足以覆盖额外开销。',
  },
  'Agent 间通信': {
    summary: '用有版本的结构化消息传递任务、状态和产物，并处理重复与跨信任域。',
    pitfall: '共享聊天记录或文件夹却没有所有权和并发规则，容易覆盖状态。',
    verify: '模拟重复消息、乱序、断线和跨组织调用，检查幂等、认证与 Artifact 交接。',
  },
  '协作失败与验证': {
    summary: '识别多 Agent 的目标偏离、循环委派和语义错误级联，并用独立证据复核结果。',
    pitfall: 'Reviewer 继承完整推理链后容易沿用前序错误，失去独立检查价值。',
    verify: '让 Reviewer 只读取原始证据和最终结果，比较它与共享上下文审查的差异。',
  },
};

const curatedDetails = {
  'Agent、Harness 与 Environment 的边界': 'Agent 负责基于观察选择下一步，Harness 管理上下文、工具、状态和约束，Environment 保存真实世界状态并返回行动结果。三者分开后，权限、恢复和评测才有明确落点。',
  'Agent Loop 的禁用条件': '任务路径固定、验证规则清楚、失败代价高或外部动作不可逆时，应优先使用普通代码和确定性 Workflow。模型可以负责分类或生成，不能自然获得无限行动权。',
  'Context Rot 与信息稀释': '上下文变长后，关键指令和证据会被大量低价值信息稀释。处理方式包括预算分区、阶段摘要、工具输出裁剪和按需检索，并通过评测确认压缩没有删掉完成任务所需的信息。',
  'Agent Status Bar 与结构化运行元数据': '把当前目标、计划、步骤、TODO、工具计数、预算和环境状态放进固定结构，由 Harness 更新。它帮助模型保持任务位置，也能向用户展示可解释的运行进度。',
  'State、Memory、RAG 与 Log 的边界': 'State 保存当前任务必须恢复的事实，Memory 保存跨阶段可复用经验，RAG 从外部知识源取证，Log 记录已经发生的事件。它们的保留期、可信度和读取方式不同。',
  '幂等性': '同一个动作被重复提交时，系统仍只产生一次预期业务效果。模型重试、网络超时和消息重复投递都会制造重复调用，可靠实现需要 Idempotency Key、业务唯一约束和副作用结果查询。',
  '事务边界、Outbox、Saga 与补偿动作': '跨服务副作用通常无法放进一个数据库事务。Outbox 保证本地状态与事件共同提交，Saga 编排多个步骤，补偿动作处理已经成功的前序操作，最终状态需要可观测和可重放。',
  '事件触发工具': '事件触发工具先登记 Agent 对某类事件的兴趣，外部事件到来后再唤醒任务。它适合 Webhook、审批、定时器和消息队列，运行时必须保存订阅、关联 ID 和过期规则。',
  '代码作为推理工具': '模型可以用代码完成计算、转换、搜索和验证，把中间步骤交给确定性运行环境。代码输出仍需沙箱、资源限制和结果检查，不能把执行成功等同于业务正确。',
  'MCP 的 Agent 到 Tool 边界': 'MCP 主要解决 Host 如何发现和调用外部 Tool、Resource 与 Prompt。它标准化能力暴露和会话交互，不自动解决跨组织 Agent 的身份、任务所有权和协作协议。',
  '观察、决策、行动、验证、更新与终止': '一次循环先读取环境和持久状态，再让模型决定动作。Harness 执行动作并验证结果，更新状态后检查成功、失败、预算和停止条件，只有满足继续条件才进入下一轮。',
  'Checkpoint、Durable Execution 与进程重启恢复': '长任务把可恢复状态写入 Checkpoint，Worker 重启后从已确认位置继续。恢复过程必须配合幂等工具、租约和事件去重，避免重复执行外部副作用。',
  'Pass@k 与能力上限': 'Pass@k 关注同一任务尝试 k 次时至少成功一次的概率，适合观察模型是否具备解决能力。它不能代表连续运行可靠性，因为真实产品往往要求每次都成功。',
  'Pass^k 与连续可靠性': 'Pass^k 关注连续 k 次任务全部成功的概率。单次成功率看起来很高时，长任务经过许多步骤后仍可能迅速下降，因此它更接近 Agent 的生产可靠性。',
  '首错归因与失败分类': '沿轨迹找到第一个使任务偏离正确路径的步骤，再判断属于模型、Prompt、Tool、检索、记忆、状态、策略还是基础设施。后续错误通常只是首错的结果。',
  '生产 Trace 到评测样本的闭环': '把真实失败清洗、脱敏并标注后加入评测集，修复必须先通过同类样本和历史回归。线上数据进入训练或规则前还要处理用户同意、分布偏差和反馈污染。',
  'Direct Prompt Injection 与 Indirect Prompt Injection': 'Direct Injection 来自用户直接输入，Indirect Injection 藏在网页、文档、邮件或工具结果中。防护依赖指令与数据隔离、最小权限、外部内容标记和动作前确定性校验。',
  '最小权限、默认拒绝与 Allowlist': 'Agent 默认没有执行权限，只获得完成当前任务所需的最小 Scope。开放世界工具和高风险动作需要显式允许，权限应当有主体、期限、资源范围和撤销路径。',
  '至少一次交付、幂等消费、去重与 DLQ': '消息系统通常保证至少一次交付，消费者必须用业务键去重并保持幂等。持续失败的消息进入 DLQ，修复后重放仍要遵守顺序和副作用约束。',
  'Human-in-the-loop 与 Human-on-the-loop': 'Human-in-the-loop 在关键步骤等待人工输入或批准，Human-on-the-loop 允许 Agent 自动运行，但人可以观察、干预和停止。选择取决于风险、可逆性和响应时间。',
  '实时响应与深度推理的认知调度': '实时交互需要几十到几百毫秒级反馈，复杂判断又需要更长推理。系统可以先用轻量模型维持对话和确认，再把困难任务交给深度推理并异步返回。',
  '独立 Reviewer 对原始证据和最终结果的复核': '独立 Reviewer 应直接读取原始要求、证据和最终产物，避免继承执行者的完整解释链。这样更容易发现共同盲点、错误引用和过早结束。',
};

const articleIndex = {
  foundations: [
    { title: '什么时候不该用 AI Agent', href: '/ai/when-not-to-use-ai-agent/' },
    { title: '生产级 AI Agent 工程', href: '/ai/production-ai-agent-engineering/' },
  ],
  'model-context': [
    { title: 'Context Engineering 怎么做', href: '/ai/context-engineering-guide/' },
    { title: '提示词工程', href: '/ai/prompt-engineering/' },
  ],
  'knowledge-state': [
    { title: 'RAG 技术全景与选型', href: '/ai/rag-primer/' },
    { title: 'AI Agent 记忆系统设计', href: '/ai/agent-memory-system-design/' },
  ],
  'tools-environment': [
    { title: '生产级 Agent Tool 怎么设计', href: '/ai/production-agent-tool-design/' },
    { title: '从 Function Call 到 Agent', href: '/ai/function-call-agent/' },
  ],
  'runtime-orchestration': [
    { title: '长任务 Agent 怎么跑稳', href: '/ai/durable-agent-task-runtime/' },
    { title: '虚拟角色任务系统', href: '/architecture/virtual-character-workflow-task-system/' },
  ],
  'evaluation-evolution': [
    { title: 'AI Agent 怎么做评测', href: '/ai/agent-evaluation-observability/' },
    { title: '生产级 AI Agent 工程', href: '/ai/production-ai-agent-engineering/' },
  ],
  'safety-governance': [
    { title: 'AI Agent 安全工程', href: '/ai/agent-security-engineering/' },
    { title: 'Agent 怎样防 Prompt Injection', href: '/ai/agent-prompt-injection-defense/' },
  ],
  'production-platform': [
    { title: '事件驱动架构怎么落地', href: '/architecture/event-driven-architecture-outbox-idempotency/' },
    { title: '长任务 Agent 怎么跑稳', href: '/ai/durable-agent-task-runtime/' },
  ],
  'interaction-collaboration': [
    { title: '实时语音 Agent 怎么做', href: '/ai/realtime-voice-agent-engineering/' },
    { title: '生产级 AI Agent 工程', href: '/ai/production-ai-agent-engineering/' },
  ],
};

const crossRelationsByTitle = [
  ['Agent、Harness 与 Environment 的边界', 'Model、Harness 与 Environment 的责任分配', '运行'],
  ['Agent、Harness 与 Environment 的边界', 'Observation、Action 与 Feedback', '使用'],
  ['自主等级与控制权分配', 'Human-in-the-loop 与 Human-on-the-loop', '使用'],
  ['Context 预算分配', 'Tokenization、Token 预算与 Context Window', '使用'],
  ['Context Rot 与信息稀释', '截断、滑动窗口、摘要与递归压缩', '保护'],
  ['JSON Schema 与类型约束', '输入 Schema、输出 Schema、枚举与边界', '前置'],
  ['State、Memory、RAG 与 Log 的边界', 'Trace、Log、Metric、Event 与 Artifact', '运行'],
  ['引用、原文定位与证据对齐', 'Groundedness、Faithfulness 与 Answer Relevance', '评测'],
  ['幂等性', '超时、取消、中断传播与资源清理', '保护'],
  ['幂等性', '至少一次交付、幂等消费、去重与 DLQ', '使用'],
  ['事务边界、Outbox、Saga 与补偿动作', '最终一致性与部分成功', '保护'],
  ['事件触发工具', '外部事件订阅、唤醒与取消订阅', '运行'],
  ['代码作为推理工具', 'Shell、REPL、Notebook 与代码执行沙箱', '使用'],
  ['MCP 的 Agent 到 Tool 边界', 'MCP Host、Client 与 Server', '使用'],
  ['观察、决策、行动、验证、更新与终止', '循环检测、无进展检测与重复行为检测', '保护'],
  ['Checkpoint、Durable Execution 与进程重启恢复', 'Artifact、Checkpoint 与 Snapshot', '使用'],
  ['Pass@k 与能力上限', 'Pass^k 与连续可靠性', '替代'],
  ['首错归因与失败分类', 'Trace 重放、差异对比、单步重跑与模型替换重跑', '使用'],
  ['生产 Trace 到评测样本的闭环', '真实失败、人工精选、黄金样本与合成数据', '使用'],
  ['Direct Prompt Injection 与 Indirect Prompt Injection', 'Prompt 注入隔离与不可信内容包装', '保护'],
  ['最小权限、默认拒绝与 Allowlist', '每 Tool Scope 与任务级临时授权', '保护'],
  ['至少一次交付、幂等消费、去重与 DLQ', '幂等性', '使用'],
  ['Human-in-the-loop 与 Human-on-the-loop', 'Approval 的 Pause、Resume、Reject、Timeout 与 Revoke', '运行'],
  ['实时响应与深度推理的认知调度', '全双工、轮次检测、延迟与抖动', '使用'],
  ['独立 Reviewer 对原始证据和最终结果的复核', 'Reviewer 上下文隔离与结论污染', '保护'],
];

function normalizeTitle(value) {
  return value.replace(/\s+/g, ' ').trim();
}

const markdown = await readFile(sourcePath, 'utf8');
const domains = [];
let domain = null;
let group = null;

for (const line of markdown.split(/\r?\n/)) {
  const domainMatch = line.match(/^##\s+(\d{2})\s+(.+)$/);
  if (domainMatch && Number(domainMatch[1]) >= 1 && Number(domainMatch[1]) <= 9) {
    const meta = domainMeta[Number(domainMatch[1]) - 1];
    domain = { ...meta, title: normalizeTitle(domainMatch[2]), groups: [] };
    domains.push(domain);
    group = null;
    continue;
  }

  const groupMatch = line.match(/^###\s+(.+?)[\s　]+(核心|场景|进阶)$/);
  if (groupMatch && domain) {
    const title = normalizeTitle(groupMatch[1]);
    const guide = groupGuides[title];
    if (!guide) throw new Error(`Missing guide for group: ${title}`);
    group = {
      id: `${domain.id}-g${String(domain.groups.length + 1).padStart(2, '0')}`,
      code: `${domain.code}.${String(domain.groups.length + 1).padStart(2, '0')}`,
      title,
      level: groupMatch[2] === '核心' ? 'core' : groupMatch[2] === '场景' ? 'scenario' : 'advanced',
      guide,
      points: [],
    };
    domain.groups.push(group);
    continue;
  }

  const pointMatch = line.match(/^-\s+(.+)$/);
  if (pointMatch && group) {
    const pointNumber = group.points.length + 1;
    const title = normalizeTitle(pointMatch[1]);
    const profile = buildPointProfile(title, group.guide, curatedDetails[title]);
    group.points.push({
      id: `${group.id}-p${String(pointNumber).padStart(2, '0')}`,
      code: `${group.code}.${String(pointNumber).padStart(2, '0')}`,
      title,
      ...profile,
    });
  }
}

const points = domains.flatMap((item) => item.groups.flatMap((entry) => entry.points));
const pointByTitle = new Map(points.map((point) => [point.title, point]));
const relations = [];

for (const [fromTitle, toTitle, type] of crossRelationsByTitle) {
  const from = pointByTitle.get(fromTitle);
  const to = pointByTitle.get(toTitle);
  if (!from || !to) {
    console.warn(`Skipped missing relation: ${fromTitle} -> ${toTitle}`);
    continue;
  }
  relations.push({ from: from.id, to: to.id, type });
}

const output = {
  meta: {
    version: 1,
    updatedAt: '2026-08-16',
    domainCount: domains.length,
    groupCount: domains.reduce((total, item) => total + item.groups.length, 0),
    pointCount: points.length,
    sources: [
      { title: 'Agentic AI 指南', href: 'https://github.com/Chasing1020/agentic-ai-guide-zh' },
      { title: '深入理解 AI Agent', href: null },
    ],
  },
  domains: domains.map((item) => ({
    ...item,
    references: bookRoutes[item.id] ?? [],
    articles: articleIndex[item.id] ?? [],
  })),
  relations,
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${output.meta.domainCount} domains, ${output.meta.groupCount} groups and ${output.meta.pointCount} points to ${outputPath}`);
