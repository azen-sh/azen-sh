import { db } from "../db/client"
import { memories } from "../db/schema"
import { embeddingProvider } from "../embed"
import { vectorStore } from "../vectors"
import { sql } from "drizzle-orm"
import type { SearchInput, SearchResult } from "@azen-sh/types"

export const SearchService = {
  async semantic(input: SearchInput): Promise<SearchResult[]> {
    const vector = await embeddingProvider.embed(input.query)
    const hits = await vectorStore.search(vector, input.topK ?? 10)
    if (!hits.length) return []

    const ids = hits.map(h => h.id)
    const rows = await db.select().from(memories).where(
      sql`${memories.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}])`
    )

    const scoreMap = new Map(hits.map(h => [h.id, h.score]))
    return rows
      .map(row => ({
        memory: {
          id: row.id,
          userId: row.userId,
          appId: row.appId,
          content: row.content,
          metadata: row.metadata as Record<string, any> ?? undefined,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          expiresAt: row.expiresAt ?? undefined,
        },
        score: scoreMap.get(row.id) ?? 0
      }))
      .sort((a, b) => b.score - a.score)
  }
}