---
description: Project conventions for azen-sh — a Bun/TypeScript memory infrastructure backend for AI agents.
globs: "*.ts, *.tsx, *.js, *.jsx, package.json"
alwaysApply: false
---

## Project Overview

**Azen** is a self-hostable memory infrastructure layer for AI agents. It provides a REST API backed by PostgreSQL (pgvector), Neo4j, Redis, and optionally Qdrant. Every memory write fans out to all three stores simultaneously.

### Monorepo Structure (Bun Workspaces)

```
server/          → @azen-sh/server   — Hono REST API (main entrypoint)
core/            → @azen-sh/core     — memory engine, DB, embeddings, vector/graph ops
packages/types/  → @azen-sh/types    — shared Zod schemas and TypeScript interfaces
packages/mcp/    → @azen-sh/mcp      — MCP CLI integration
packages/integrations/ → langchain, vercel-ai adapters (WIP)
```

## Runtime & Tooling

Use **Bun** exclusively — not Node.js, npm, pnpm, or yarn.

- `bun <file>` instead of `node <file>` or `ts-node <file>`
- `bun install` instead of `npm install`
- `bun run <script>` instead of `npm run <script>`
- `bun test` instead of `jest` or `vitest`
- `bun build <file.ts>` instead of `webpack` or `esbuild`
- Bun automatically loads `.env` — do not use `dotenv`
- Prefer `Bun.file` over `node:fs` readFile/writeFile
- Use `Bun.$\`cmd\`` instead of `execa`

## Web Framework

Use **Hono** — not Express, Fastify, or `Bun.serve()` raw API.

```ts
import { Hono } from "hono"
import { cors } from "hono/cors"
import { zValidator } from "@hono/zod-validator"

const router = new Hono()

router.post("/", zValidator("json", MySchema), async (c) => {
  const input = c.req.valid("json")
  return c.json(result)
})
```

- Use `@hono/zod-validator` for input validation on all routes
- Use `hono/cors` and `hono/logger` middleware at the app level
- Return errors as `c.json({ error: message }, status)`

## Database & Infrastructure

### PostgreSQL (primary store)
- Use **Drizzle ORM** — not `pg`, `postgres.js`, `Bun.sql`, or any other client
- Driver: `postgres` (postgres-js) via Drizzle's `drizzle(postgres(url))` pattern
- Migrations live in `core/db/migrations/`, generated with `drizzle-kit`
- Run migrations: `bun run --filter ./core db:migrate`
- Generate migrations: `bun run --filter ./core db:generate`
- Browse schema: `bun run --filter ./core db:studio`
- Schema is in `core/db/schema.ts` — memories table with pgvector embedding column

### Neo4j (graph store)
- Use **neo4j-driver** — already set up in `core/graph/`
- All nodes use `MERGE` (not `CREATE`) for idempotency
- Call `initGraph()` from core on startup to ensure constraints/indices exist
- Do not bypass `initGraph()` or create constraints manually

### Redis (cache/queue)
- Use **ioredis** — not `Bun.redis` (project already uses ioredis)
- Redis is also the backing store for **BullMQ** job queues

### Qdrant (optional vector store)
- Use `@qdrant/js-client-rest` — already set up in `core/vectors/`
- Pluggable via `VECTOR_STORE=qdrant` env var; default is `pgvector`

## Validation

Use **Zod 4.x** for all schema definitions. Shared schemas live in `@azen-sh/types` — import from there before defining new ones.

```ts
import { MemorySchema, AddMemoryInputSchema } from "@azen-sh/types"
```

## Architecture Patterns

### Fan-out writes
Every memory creation writes to three stores in sequence:
1. Insert canonical record into PostgreSQL via Drizzle
2. Generate embedding via OpenAI, upsert to vector store (pgvector or Qdrant)
3. Create/MERGE node in Neo4j graph

Follow this pattern in `MemoryService` — do not skip any store.

### Multi-tenancy
All memory operations are scoped by `userId` (required) + `appId` (defaults to `"default"`). Always include both in queries and inserts.

### Provider abstraction
- `EmbeddingProvider` interface — currently only OpenAI implementation
- `VectorStore` interface — pgvector and Qdrant implementations
- `GraphStore` interface — Neo4j implementation
- Factory functions in core select implementation based on env vars

## Key Environment Variables

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | — | Required. PostgreSQL connection string |
| `NEO4J_URL` | — | Required. bolt://... |
| `NEO4J_USER` | neo4j | |
| `NEO4J_PASSWORD` | — | Required |
| `REDIS_URL` | — | Required |
| `OPENAI_API_KEY` | — | Required for embeddings |
| `QDRANT_URL` | — | Required only if `VECTOR_STORE=qdrant` |
| `VECTOR_STORE` | pgvector | `pgvector` or `qdrant` |
| `EMBEDDING_MODEL` | text-embedding-3-small | |
| `EMBEDDING_BASE_URL` | — | Custom OpenAI-compatible endpoint |
| `PORT` | 3000 | |

## Scripts

```bash
# Development
bun run dev                            # Start server (hot-reload)
docker compose -f docker-compose.dev.yml up -d  # Start all infra (dev)

# Database
bun run --filter ./core db:migrate     # Run pending migrations
bun run --filter ./core db:generate    # Generate new migration from schema
bun run --filter ./core db:studio      # Open Drizzle Studio

# Build & checks
bun run build                          # Build all packages
bun run typecheck                      # Type-check all packages
bun test                               # Run all tests

# Production
docker compose up -d                   # Build image + start all services
```

## Testing

```ts
import { test, expect } from "bun:test"

test("example", () => {
  expect(1).toBe(1)
})
```

Run with `bun test`. No Jest or Vitest.

## TypeScript

- Strict mode enabled across all packages
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `noUncheckedIndexedAccess: true` — handle potential undefined on array/object access
- `moduleResolution: bundler` — Bun-compatible resolution
- Workspace imports use package names: `import { ... } from "@azen-sh/core"`
