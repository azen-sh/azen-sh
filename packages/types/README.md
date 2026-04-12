# @azen-sh/types

Shared Zod schemas and TypeScript types used across all Azen packages.

## What's in here

- **Schemas** — `MemorySchema`, `AddMemoryInputSchema`, `UpdateMemoryInputSchema`, `SearchInputSchema`
- **Types** — `Memory`, `SearchResult`, `SearchInput`, `AddMemoryInput`, `UpdateMemoryInput`
- **Interfaces** — `EmbeddingProvider`, `VectorStore`, `GraphStore`, `LLMProvider`
- **Config types** — `VectorStoreType`, `EmbeddingProviderType`, `LLMProviderType`

## Usage

```ts
import { MemorySchema, AddMemoryInputSchema } from "@azen-sh/types"
import type { Memory, SearchResult, EmbeddingProvider } from "@azen-sh/types"
```

All input validation in the server routes and core services uses these schemas. Import from here before defining new ones.
