# @azen-sh/server

The REST API server for Azen. Built with [Hono](https://hono.dev/) and deployed via Docker.

## Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/memories` | Create a new memory |
| `GET` | `/memories` | List memories (filtered by `userId` + `appId`) |
| `GET` | `/memories/:id` | Get a single memory |
| `PATCH` | `/memories/:id` | Update a memory |
| `DELETE` | `/memories/:id` | Delete a memory |
| `DELETE` | `/memories` | Delete all memories for a user |
| `GET` | `/search` | Semantic search with optional graph expansion |
| `GET` | `/health` | Health check |

## Running locally

```bash
# Start infrastructure (Postgres, Neo4j, Redis)
docker compose -f docker-compose.dev.yml up -d

# Start the server with hot-reload
bun run dev
```

The API is live at `http://localhost:3000`.

## Build

```bash
bun run --filter ./server build
```
