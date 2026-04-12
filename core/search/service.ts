import { db } from "../db/client"
import { memories } from "../db/schema"
import { embeddingProvider } from "../embed"
import { vectorStore } from "../vectors"
import { graphOps } from "../graph/operations"
import { sql } from "drizzle-orm"
import type { SearchInput, SearchResult } from "@azen-sh/types"

export const SearchService = {
  async semantic(input: SearchInput): Promise<SearchResult[]> {
    const vector = await embeddingProvider.embed(input.query)
    const topK = input.topK ?? 10
    const hits = await vectorStore.search(vector, topK, {
      userId: input.userId,
      appId: input.appId,
    })
    if (!hits.length) return []

    const ids = hits.map(h => h.id)
    const rows = await db.select().from(memories).where(
      sql`${memories.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}])
        AND ${memories.userId} = ${input.userId}
        AND ${memories.appId} = ${input.appId}`
    )

    const scoreMap = new Map(hits.map(h => [h.id, h.score]))
    const vectorResults: SearchResult[] = rows
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
        score: scoreMap.get(row.id) ?? 0,
        source: "vector" as const,
      }))
      .sort((a, b) => b.score - a.score)

    if (input.includeGraph === false) return vectorResults

    // Graph expansion: find memories sharing entities with vector results
    const vectorIds = vectorResults.map(r => r.memory.id)
    const graphIds = await graphOps.getRelatedViaEntities(vectorIds, topK)

    if (!graphIds.length) return vectorResults

    // Fetch graph memories from PG, deduplicating against vector results
    const vectorIdSet = new Set(vectorIds)
    const newGraphIds = graphIds.filter(id => !vectorIdSet.has(id))
    if (!newGraphIds.length) return vectorResults

    const graphRows = await db.select().from(memories).where(
      sql`${memories.id} = ANY(ARRAY[${sql.join(newGraphIds.map(id => sql`${id}::uuid`), sql`, `)}])
        AND ${memories.userId} = ${input.userId}
        AND ${memories.appId} = ${input.appId}`
    )

    const maxVectorScore = vectorResults[0]?.score ?? 1
    const graphResults: SearchResult[] = graphRows.map(row => ({
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
      score: maxVectorScore * 0.6,
      source: "graph" as const,
    }))

    return [...vectorResults, ...graphResults]
  }
}