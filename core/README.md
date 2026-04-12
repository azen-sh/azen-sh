# @azen-sh/core

The core engine behind Azen. Handles memory CRUD, semantic search, embedding generation, vector storage, graph operations, entity extraction, and async fan-out — all exposed as service objects.

## Modules

| Module | Description |
|---|---|
| `memories/` | `MemoryService` — CRUD operations on memories, enqueues async fan-out jobs |
| `search/` | `SearchService` — vector similarity search with optional graph expansion via shared entities |
| `embed/` | `EmbeddingProvider` abstraction — currently OpenAI (`text-embedding-3-small` default) |
| `llm/` | `LLMProvider` abstraction — used for entity extraction (`gpt-4o-mini` default) |
| `vectors/` | `VectorStore` abstraction — pgvector or Qdrant, selected via `VECTOR_STORE` env var |
| `graph/` | Neo4j client, graph operations (Memory + Entity nodes), entity extraction from memory content |
| `queue/` | BullMQ worker — processes `memory.sync`, `memory.update`, `memory.delete` jobs asynchronously |
| `db/` | Drizzle ORM schema, migrations, and client setup |

## Usage

This package is used internally by `@azen-sh/server`. Import from the package name:

```ts
import { MemoryService, SearchService, initGraph, startWorker } from "@azen-sh/core"
```

## Database commands

```bash
bun run --filter ./core db:migrate     # Run pending migrations
bun run --filter ./core db:generate    # Generate new migration from schema
bun run --filter ./core db:studio      # Open Drizzle Studio
```
