---
title: 从 Demo 到服务：一个可落地的 RAG 知识库组件实战
description: 基于 FastAPI + LlamaIndex + pgvector 的轻量知识库组件实战，讲清楚业务数据与 RAG 引擎分离、多租户权限、后台索引、国产模型接入等落地细节与踩坑
---

> 太长不看：RAG 教程大多停留在 Jupyter Notebook 里跑通一次检索。真正把它做成一个可部署、可接入、可管理的组件，需要解决**多租户、权限、文件管理、索引、配置化、部署**等问题。本文记录了我基于 FastAPI + LlamaIndex + pgvector 实现这个组件的过程，重点讲架构决策和踩过的坑。

## 为什么做这个

我做这个项目的初衷很简单：大部分 RAG 示例代码只回答"怎么让 LLM 读一段文档"，但企业里真正需要的是：

- 多个业务方共享一套检索能力，但数据彼此隔离
- 不同的知识库用不同的切分策略、Embedding 模型、生成模型
- 上传文件后自动索引，能看进度和状态
- 可以切换国产模型（通义千问、DeepSeek），而不是被某个模型绑定
- 一个 `docker compose up` 就能跑起来

也就是说，RAG 不应该是一个Demo，而应该是一个**可嵌入业务系统的组件**。

我把它命名为 **KB Component（Knowledge Base Component）**：轻量、开放 REST API、数据与 RAG 引擎分离、单 Docker Compose 部署。

## 技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| Web 框架 | FastAPI + uvicorn | 异步、类型友好、生态成熟、Swagger 自动生成 |
| 数据库 | PostgreSQL + pgvector | 业务数据与向量数据统一管理，减少部署复杂度 |
| ORM | SQLAlchemy 2.0 async | 原生 async 支持，类型提示好 |
| RAG 编排 | LlamaIndex | 生态最大，Vector Store、Retriever、LLM 可替换 |
| Embedding | 阿里百炼 text-embedding-v3 | 中文效果好，OpenAI-compatible 接口 |
| LLM | DashScope / DeepSeek API | 国产模型，OpenAI-compatible |
| 对象存储 | MinIO | S3-compatible，本地/私有云都能用 |
| 后台管理 | 纯 HTML/JS 单页 | 不引入构建链路，直接嵌入 FastAPI 静态服务 |
| 迁移 | Alembic | 数据库版本可控 |

## 三层架构：让业务数据和 RAG 引擎解耦

这是整个项目最关键的设计决策。

我看过不少 RAG 项目把"用户、文件、权限"直接交给 RAG 框架管理，比如用 LlamaIndex 的节点 metadata 来存文件所有者。这样做有两个隐患：

1. **业务规则和检索逻辑混在一起**：想加一个"用户组权限"，得去改 RAG 引擎。
2. **换引擎成本高**：今天用 LlamaIndex，明天想换 LightRAG 或自研，业务数据会被一起带走。

所以我强制做三层分离：

```
┌─────────────────────────────────────────┐
│  接口层：REST API + Admin UI             │
│  /users /groups /knowledge-bases /search │
├─────────────────────────────────────────┤
│  业务数据层：PostgreSQL                   │
│  users, groups, files, permissions, kbs  │
├─────────────────────────────────────────┤
│  RAG 引擎层：LlamaIndex + pgvector        │
│  只负责索引、检索、生成，不拥有业务数据    │
└─────────────────────────────────────────┘
```

这个原则写在项目的 `CONTEXT.md` 里：

> Business data lives in PostgreSQL and is independent of any RAG engine.

带来的好处是：

- 接口层固定，底层引擎可以替换；
- 用户/组/权限逻辑完全由 SQLAlchemy 模型管理，不走 RAG 框架；
- 每个知识库可以配置不同的 engine，未来支持多引擎并行。

## 核心流程

### 1. 创建知识库

```bash
POST /api/v1/knowledge-bases
{
  "name": "产品手册",
  "description": "内部产品文档",
  "engine_config": {
    "embedding_model": "text-embedding-v3",
    "llm_model": "qwen-max"
  },
  "user_id": "u001"
}
```

后台只会在 `knowledge_bases` 表里插入一条记录，**不会立即创建向量表**。向量表在首次有文件索引时按需创建。

### 2. 上传文件

```bash
POST /api/v1/knowledge-bases/{kb_id}/files
Content-Type: multipart/form-data
user_id=u001&file=@产品手册.pdf
```

文件流程：

1. 先存到临时目录；
2. 上传到 MinIO，返回 `storage_path`；
3. 在 `files` 表里创建记录，状态为 `uploaded`；
4. 后台启动 `asyncio.create_task(_auto_index(...))` 自动索引。

返回 201 时文件已经落库，但索引是异步的。调用方可以轮询 `/files` 看状态：`uploaded` / `indexing` / `indexed` / `failed`。

### 3. 查询

```bash
POST /api/v1/search
{
  "question": "年假满三年是多少天？",
  "user_id": "u001",
  "kb_ids": ["kb_abc123"],
  "top_k": 5
}
```

返回：

```json
{
  "answer": "根据员工手册，满 3 年年假为 10 天。",
  "sources": [
    {
      "chunk_id": "...",
      "file_name": "员工手册.pdf",
      "content": "...",
      "score": 0.8723
    }
  ],
  "latency_ms": 1240,
  "kb_ids": ["kb_abc123"]
}
}
```

同时会把查询日志写入 `query_logs`，用于后续效果分析和成本统计。

## 关键代码：为什么自己写 Embedding 类

LlamaIndex 默认支持 OpenAI Embedding，但阿里百炼的接口虽然 OpenAI-compatible，字段上仍有细微差别。为了不被黑盒封装限制，我直接继承 `BaseEmbedding` 写了一个自定义实现：

```python
import httpx
from llama_index.core.embeddings import BaseEmbedding
from pydantic import PrivateAttr

class AliyunEmbedding(BaseEmbedding):
    def __init__(self, api_key: str, api_base: str, model: str = "text-embedding-v3"):
        super().__init__(embed_batch_size=10)
        self._api_key = api_key
        self._api_base = api_base
        self._model = model

    def _get_embedding(self, texts: list[str]) -> list[list[float]]:
        url = f"{self._api_base}/embeddings"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {"model": self._model, "input": texts}
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
        return [item["embedding"] for item in data["data"]]

    def _get_query_embedding(self, query: str) -> list[float]:
        return self._get_embedding([query])[0]

    def _get_text_embedding(self, text: str) -> list[float]:
        return self._get_embedding([text])[0]
```

这样做的好处：

- 完全掌控请求参数和错误处理；
- 可以切换任意 OpenAI-compatible 的 Embedding 服务；
- 方便加日志、重试、限流、成本统计。

## 关键代码：每个知识库独立的向量表

```python
class RAGEngine:
    def _get_vector_store(self, kb_id: str) -> PGVectorStore:
        return PGVectorStore.from_params(
            database="kb_dev",
            host="postgres",
            user="kb",
            password="kb",
            port=5432,
            table_name=f"kb_{kb_id.replace('-', '_')}",
            embed_dim=1024,  # text-embedding-v3 输出 1024 维
        )
```

每个知识库有独立的表，优点：

- 数据隔离清晰，删除知识库时直接删表即可；
- 不同知识库可以用不同的 embed_dim / 索引策略；
- 备份和迁移按 KB 进行，粒度合适。

代价是表数量会增长，但 pgvector 表是轻量的，且通过表名前缀很好管理。

## 关键代码：多知识库检索与排序

```python
async def query(self, kb_ids: list[str], question: str, top_k: int = 5) -> dict:
    all_nodes = []
    for kb_id in kb_ids:
        vector_store = self._get_vector_store(kb_id)
        index = VectorStoreIndex.from_vector_store(vector_store)
        retriever = index.as_retriever(similarity_top_k=top_k)
        nodes = await retriever.aretrieve(question)
        all_nodes.extend(nodes)

    all_nodes.sort(key=lambda n: n.score or 0, reverse=True)
    top_nodes = all_nodes[:top_k]

    sources = [...]
    context = "\n\n".join([s["content"] for s in sources])
    prompt = f"Based on the following context, answer the question...\n\n{context}\n\nQuestion: {question}"
    answer = self._call_llm_api(prompt)
    return {"answer": answer, "sources": sources, "latency_ms": ...}
```

这里有一个实用细节：对每个 KB 分别检索 top_k，再全局按 score 取 top_k。这样当跨多个 KB 查询时，不会因为某个 KB 质量差而拖累整体结果。

## 踩坑记录

### 1. Embedding 接口"兼容"不等于"一致"

阿里百炼的 `/embeddings` 接口和 OpenAI 几乎一样，但错误码和 rate limit 提示不同。最开始我用 LlamaIndex 的 OpenAI wrapper，报错时拿不到真实原因。自定义 `AliyunEmbedding` 后才解决。

**经验**：只要是非 OpenAI 官方服务，都建议自己封装一层，不要把错误处理交给第三方抽象。

### 2. 异步 SQLAlchemy + 同步 LlamaIndex 的混合

LlamaIndex 很多 API 是同步的，但 FastAPI 路由是 async。我目前用 `asyncio.create_task()` 把索引任务丢到后台，避免阻塞请求。更彻底的做法是加 Celery/RQ，但 MVP 阶段后台任务就够了。

**经验**：先让主链路 async，重活异步化。不要因为框架是 sync 就阻塞整个请求。

### 3. 文件解析的内存与超时

大 PDF 解析会吃掉大量内存，`pypdf` 一页一页读也不保险。我现在的做法是：

- 限制单次上传文件大小；
- 解析抛异常时把状态改为 `failed`，并记录错误信息；
- 后续计划接入 Docling，对复杂版式文档更友好。

### 4. 权限目前是 MVP，但架构已经预留

`get_accessible_kb_ids` 当前返回所有 active KB，因为项目第一阶段先把检索跑通。但用户、组、权限表已经设计好，后续加权限只需改这一处查询逻辑，不影响 RAG 引擎。

**经验**：做 MVP 时也要把"扩展点"预留好，不然后续改起来伤筋动骨。

### 5. Admin UI 直接嵌入 FastAPI，减少部署负担

没有用 React/Vue 构建，而是写了一个纯 HTML/JS 的单页，放在 `app/admin/index.html`，由 FastAPI 静态文件服务提供：

```python
admin_dir = os.path.join(os.path.dirname(__file__), "admin")
if os.path.isdir(admin_dir):
    app.mount("/admin", StaticFiles(directory=admin_dir, html=True), name="admin")
```

这样不需要单独的前端构建和部署，启动一个容器就能用。

## 部署：单 Docker Compose 启动

```bash
# 启动 postgres + kb-api
docker compose up -d

# 数据库迁移
docker compose exec kb-api alembic upgrade head

# 访问
open http://localhost:8000/admin
```

`docker-compose.yml` 里只包含两个服务：PostgreSQL（带 pgvector）和 kb-api。代码通过 volume 挂载，开发时支持热更新。

## 当前状态与后续演进

这个组件目前落地了**第一阶段**：LlamaIndex + pgvector + 自定义 Embedding + 国产 LLM + 多知识库管理。

从项目架构图来看，我预留了更大的演进空间：

```
RAG 引擎层（可插拔）
├── PageIndex   # 无向量、可解释、适合精确文档问答
├── LightRAG    # 知识图谱 + 向量，适合跨文档推理
└── LlamaIndex  # 通用向量检索，当前已实现
```

下一步：

1. **接入 Agent**：把 `/search` 包装成一个 Tool，让 Agent 在需要时调用知识库。
2. **MCP 支持**：让知识库通过 MCP 协议暴露给 Claude、Cursor 等 Host。
3. **更细权限**：按用户组控制 KB 访问，按文件控制可见范围。
4. **多模态解析**：从 PDF 文字解析扩展到表格、图片 OCR。
5. **可观测性**：接入 Langfuse / LangSmith，记录每次查询的 cost、latency、检索质量。

## 总结

把 RAG 从 Demo 做成服务，核心不是换一个更牛的模型，而是把**业务边界、数据归属、索引流程、配置管理、部署方式**想清楚。

这个项目给我最大的体会是：**RAG 框架只应该做它该做的事——索引和检索；你的用户、权限、文件、日志，必须自己管。** 这个边界守住了，系统才能从"能跑"走向"能长期演进"。

---

## 相关资源

- 项目代码：`(私有仓库，暂不公开)`
- LlamaIndex 文档：https://docs.llamaindex.ai
- pgvector：https://github.com/pgvector/pgvector
- 阿里百炼 Embedding：https://help.aliyun.com/zh/dashscope/developer-reference/text-embedding-api-details
- 上篇基础概念：[RAG 原理与实践：让 LLM 用上「你的知识」](/ai/rag-primer/)
