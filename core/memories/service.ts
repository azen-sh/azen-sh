import { db } from "../db/client"
import { memories } from "../db/schema"
import { embeddingProvider } from "../embed"
import { vectorStore } from "../vectors"
import { graphOps } from "../graph/operations"
import { eq, and } from "drizzle-orm"
import type { AddMemoryInput, UpdateMemoryInput, Memory } from "@azen-sh/types"

function toMemory(row: any): Memory {
  return {
    id: row.id,
    userId: row.userId,
    appId: row.appId,
    content: row.content,
    metadata: row.metadata ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt ?? undefined,
  }
}

export const MemoryService = {
  async add(input: AddMemoryInput): Promise<Memory> {
    const [row] = await db.insert(memories).values({
      userId: input.userId,
      appId: input.appId ?? "default",
      content: input.content,
      metadata: input.metadata,
      expiresAt: input.expiresAt,
    }).returning()

    if(!row) throw new Error("no row returned");

    const vector = await embeddingProvider.embed(input.content)
    await vectorStore.upsert(row.id, vector)
    const memory = toMemory(row)
    await graphOps.addMemory(memory)

    return memory
  },

  async get(id: string): Promise<Memory | null> {
    const [row] = await db.select().from(memories).where(eq(memories.id, id))
    return row ? toMemory(row) : null
  },

  async list(userId: string, appId = "default"): Promise<Memory[]> {
    const rows = await db.select().from(memories).where(
      and(eq(memories.userId, userId), eq(memories.appId, appId))
    )
    return rows.map(toMemory)
  },

  async update(id: string, input: UpdateMemoryInput): Promise<Memory | null> {
    const [row] = await db.update(memories)
      .set({
        ...(input.content && { content: input.content }),
        ...(input.metadata && { metadata: input.metadata }),
        updatedAt: new Date(),
      })
      .where(eq(memories.id, id))
      .returning()

    if (!row) return null

    if (input.content) {
      const vector = await embeddingProvider.embed(input.content)
      await vectorStore.upsert(row.id, vector)
    }

    return toMemory(row)
  },

  async delete(id: string): Promise<void> {
    await db.delete(memories).where(eq(memories.id, id))
    await vectorStore.delete(id)
    await graphOps.deleteMemory(id)
  },

  async deleteByUser(userId: string, appId = "default"): Promise<void> {
    await db.delete(memories).where(
      and(eq(memories.userId, userId), eq(memories.appId, appId))
    )
    await vectorStore.deleteByUser(userId, appId)
    await graphOps.deleteByUser(userId, appId)
  }
}