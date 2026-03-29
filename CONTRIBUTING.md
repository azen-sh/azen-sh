# Contributing to Azen

## Prerequisites

- [Bun](https://bun.sh) (latest)
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

## Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/azen-sh/azen.git
cd azen
bun install
```

2. Copy the example env and fill in your values:

```bash
cp .env.example .env
```

3. Start the infrastructure (Postgres, Neo4j, Redis):

```bash
docker compose -f docker-compose.dev.yml up -d
```

4. Run database migrations:

```bash
bun run --filter ./core db:migrate
```

5. Start the dev server:

```bash
bun run dev
```

## Running Tests

```bash
bun run test
```

Tests live in the `tests/` directory at the root. No infrastructure needed — all external dependencies are mocked.

## Making Changes

1. Create a branch off `main`
2. Make your changes
3. Run `bun run typecheck` and `bun run test` locally before pushing
4. Open a PR against `main`
5. CI must pass (typecheck + test + build) before merging

## Project Conventions

- **Bun** — not Node, npm, pnpm, or yarn
- **Hono** — not Express or Fastify
- **Drizzle ORM** — not raw SQL or other ORMs
- **Zod** — for all validation. Shared schemas go in `packages/types/`
- **bun:test** — not Jest or Vitest

## Monorepo Structure

```
server/          → Hono REST API
core/            → Memory engine, DB, embeddings, vector/graph ops
packages/types/  → Shared Zod schemas and TypeScript types
packages/mcp/    → MCP CLI integration
tests/           → All tests
```

## Need Help?

Open an issue — bug reports and feature requests both have templates.
