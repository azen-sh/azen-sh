<div align="center">

<br />

```
   ___   _______  ____  _  __
  / _ | /_  / _ \/ __ \/ |/ /
 / __ |  / / ___/ /_/ /    /
/_/ |_| /___/_/   \____/_/|_/
```

### Memory infrastructure for AI agents

<p>
  <a href="https://github.com/govindvashishat/azen-sh/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
  <a href="https://bun.sh">
    <img src="https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun" alt="Bun" />
  </a>
  <img src="https://img.shields.io/badge/language-TypeScript-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/status-alpha-orange" alt="Status: Alpha" />
</p>

<p>
  <b>Self-hostable · Provider-agnostic · Graph-aware · Semantically searchable</b>
</p>

</div>

---

**Azen** is an open-source memory layer you can drop into any AI application. Store, retrieve, and search memories across conversations using vector similarity, graph traversal, and full-text search — all from a single REST API or MCP server.

> Think of it as a long-term memory backend for your agents: persistent, structured, and queryable.

<br />

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Application                      │
│          SDK / REST API / MCP / LangChain / Vercel AI        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Azen API Server                         │
│                    (Hono · TypeScript)                       │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼────────────────────────┐
│    Core Engine       │   │         Embedding Providers         │
│  MemoryService       │   │  Ollama (local) · OpenAI · Custom   │
│  SearchService       │   └────────────────────────────────────┘
└──┬───────┬───────┬──┘
   │       │       │
   ▼       ▼       ▼
┌──────┐ ┌──────┐ ┌──────────────────┐
│  PG  │ │Neo4j │ │  Vector Store     │
│(SQL) │ │(Graph│ │  pgvector/Qdrant  │
└──────┘ └──────┘ └──────────────────┘
```

Every memory write fans out to three stores simultaneously:
- **PostgreSQL** — canonical record with full metadata
- **Vector store** — embedding for semantic nearest-neighbor search
- **Neo4j** — graph node for relationship traversal

<br />

## Features

| | |
|---|---|
| **Semantic search** | Query memories by meaning, not keywords, using vector embeddings |
| **Graph-aware** | Traverse relationships between memories up to arbitrary depth with Neo4j |
| **Multi-provider embeddings** | Ollama (local/private), OpenAI, or any OpenAI-compatible endpoint |
| **Pluggable vector stores** | pgvector (zero extra infra) or Qdrant (high-scale) |
| **MCP server** | Native Model Context Protocol integration for Claude, Cursor, and any MCP client |
| **Framework integrations** | Drop-in packages for LangChain and Vercel AI SDK |
| **Self-hostable** | Full Docker Compose stack — no cloud dependency |
| **Per-app namespacing** | Scope memories by `userId` + `appId` for multi-tenant use cases |
| **TTL support** | Set `expiresAt` on any memory for automatic expiry |

<br />

## Quickstart

### 1. Clone and install

```bash
git clone https://github.com/govindvashishat/azen-sh
cd azen-sh
bun install
```

### 2. Start the infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```

This brings up PostgreSQL (with pgvector), Neo4j, Qdrant, and Redis.

### 3. Configure environment

```bash
cp .env.example .env
```

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/azen_dev

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Embedding provider: "ollama" | "openai" | "custom"
EMBEDDING_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=nomic-embed-text

# Or use OpenAI
# EMBEDDING_PROVIDER=openai
# OPENAI_API_KEY=sk-...

# Vector store: "pgvector" | "qdrant"
VECTOR_STORE=pgvector
# QDRANT_URL=http://localhost:6333
```

### 4. Run migrations and start

```bash
bun run --filter ./core db:migrate
bun run dev
```

The API is now live at `http://localhost:3000`.

<br />

## API Reference

### Add a memory

```http
POST /memories
Content-Type: application/json

{
  "userId": "user_123",
  "appId": "my-chatbot",
  "content": "The user prefers concise responses and dislikes bullet points.",
  "metadata": { "source": "conversation", "turn": 42 }
}
```

```json
{
  "id": "mem_01jk...",
  "userId": "user_123",
  "appId": "my-chatbot",
  "content": "The user prefers concise responses and dislikes bullet points.",
  "metadata": { "source": "conversation", "turn": 42 },
  "createdAt": "2026-02-28T10:00:00.000Z",
  "updatedAt": "2026-02-28T10:00:00.000Z"
}
```

### Semantic search

```http
GET /search?userId=user_123&appId=my-chatbot&query=user+communication+style&topK=5
```

```json
[
  {
    "memory": { "id": "mem_01jk...", "content": "..." },
    "score": 0.94
  }
]
```

### List memories

```http
GET /memories?userId=user_123&appId=my-chatbot
```

### Update a memory

```http
PATCH /memories/:id
Content-Type: application/json

{
  "content": "Updated content."
}
```

### Delete a memory

```http
DELETE /memories/:id
```

### Delete all memories for a user

```http
DELETE /memories?userId=user_123&appId=my-chatbot
```

<br />

## Integrations

### MCP Server

Expose Azen as an MCP tool to any compatible client (Claude Desktop, Cursor, etc.):

```bash
bun run --filter ./packages/mcp start
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "azen": {
      "command": "bun",
      "args": ["run", "./packages/mcp/index.ts"],
      "env": { "AZEN_API_URL": "http://localhost:3000" }
    }
  }
}
```

### Vercel AI SDK

```ts
import { AzenMemory } from "@azen-sh/vercel-ai"

const memory = new AzenMemory({ baseUrl: "http://localhost:3000" })

// Before generating a response, retrieve relevant context
const context = await memory.search({
  userId: "user_123",
  query: userMessage,
  topK: 5,
})
```

### LangChain

```ts
import { AzenMemoryStore } from "@azen-sh/langchain"

const store = new AzenMemoryStore({
  baseUrl: "http://localhost:3000",
  userId: "user_123",
})
```

<br />

## Embedding Providers

| Provider | `EMBEDDING_PROVIDER` | Notes |
|---|---|---|
| Ollama | `ollama` | Fully local. Default model: `nomic-embed-text`. |
| OpenAI | `openai` | Requires `OPENAI_API_KEY`. Uses `text-embedding-3-small`. |
| Custom | `custom` | Any OpenAI-compatible endpoint via `OPENAI_BASE_URL`. |

<br />

## Vector Stores

| Store | `VECTOR_STORE` | Notes |
|---|---|---|
| pgvector | `pgvector` | Built into PostgreSQL. Zero extra infra. |
| Qdrant | `qdrant` | Standalone vector database. Better for large-scale workloads. |

<br />

## Monorepo Structure

```
azen-sh/
├── server/              # Hono REST API server
├── core/                # Core engine
│   ├── memories/        # MemoryService — CRUD + fan-out writes
│   ├── search/          # SearchService — semantic retrieval
│   ├── embed/           # Embedding provider abstraction
│   ├── vectors/         # Vector store abstraction (pgvector, Qdrant)
│   ├── graph/           # Neo4j client + graph operations
│   └── db/              # Drizzle ORM schema + migrations
├── packages/
│   ├── mcp/             # Model Context Protocol server
│   ├── types/           # Shared TypeScript types
│   └── integrations/
│       ├── vercel-ai/   # Vercel AI SDK integration
│       └── langchain/   # LangChain integration
├── examples/
│   ├── nextjs-chatbot/  # Full Next.js chatbot with persistent memory
│   └── agent-mcp/       # MCP agent example
└── docker/              # Init scripts for Postgres and Neo4j
```

<br />

## Self-Hosting

All infrastructure is defined in `docker-compose.dev.yml`. For production, a hardened Compose file and Kubernetes Helm chart are on the roadmap.

```bash
# Start all services
docker compose -f docker-compose.dev.yml up -d

# Services exposed:
#   PostgreSQL  → localhost:5432
#   Redis       → localhost:6379
#   Neo4j       → localhost:7474  (browser), localhost:7687 (bolt)
#   Qdrant      → localhost:6333
```

<br />

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

```bash
# Run all tests
bun test

# Type-check all packages
bun run typecheck
```

<br />

## License

[MIT](./LICENSE)

---

<div align="center">
  <sub>Built with <a href="https://bun.sh">Bun</a> · Powered by pgvector, Neo4j, and Qdrant</sub>
</div>
