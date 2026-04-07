# @azen-sh/web

A web dashboard for managing Azen memories. Browse, search, create, and delete memories from your browser instead of curling the API.

## Stack

- **React 19** + **TypeScript**
- **Vite** for dev server and build
- **Tailwind CSS v4**
- **React Router** for client-side routing
- **Lucide** for icons

## Pages

| Page | Description |
|---|---|
| **Memories** | Paginated table with `userId` / `appId` filters, click for detail, inline delete |
| **Search** | Semantic search with query input and results showing relevance scores |
| **Add Memory** | Form to create a new memory with `userId`, `appId`, content, and JSON metadata |

## Running locally

The dashboard talks to the Azen API at `http://localhost:3000` via a Vite dev proxy, so the server must be running first.

**1. Start the API server** (from the repo root):

```bash
docker compose -f docker-compose.dev.yml up -d   # infrastructure
bun run --filter ./server dev                    # API server
```

**2. Start the web dashboard**:

```bash
bun run --filter ./web dev
```

The dashboard is live at `http://localhost:5173`.

## How the API proxy works

In dev, the frontend calls `/api/memories`, which Vite forwards to `http://localhost:3000/memories`. This avoids CORS issues and means no environment variable is needed in dev. See `vite.config.ts` for the proxy config.

## Build

```bash
bun run --filter ./web build
```

Output goes to `web/dist/`.
