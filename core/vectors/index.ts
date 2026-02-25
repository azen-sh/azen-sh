import type { VectorStore } from "@azen-sh/types";
import { PgVectorStore } from "./providers/pgvector";
import { QdrantVectorStore } from "./providers/qdrant";

function createVectorStore(): VectorStore {
    const store = process.env.VECTOR_STORE ?? "pgvector"
    switch (store) {
      case "pgvector": return new PgVectorStore()
      case "qdrant": return new QdrantVectorStore()
      default:
        throw new Error(`Unknown VECTOR_STORE: ${store}. Options: pgvector, qdrant`);
    }
};

export const vectorStore = createVectorStore();