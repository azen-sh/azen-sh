import { driver } from "./client"
import type { Memory } from "@azen-sh/types"

export const graphOps = {
  async addMemory(memory: Memory) {
    const session = driver.session()
    try {
      await session.run(`
        MERGE (m:Memory {id: $id})
        SET m.userId = $userId,
            m.appId = $appId,
            m.content = $content,
            m.createdAt = $createdAt
      `, {
        id: memory.id,
        userId: memory.userId,
        appId: memory.appId,
        content: memory.content,
        createdAt: memory.createdAt.toISOString()
      })
    } finally {
      await session.close()
    }
  },

  async getRelated(memoryId: string, depth: number = 2): Promise<string[]> {
    const session = driver.session()
    try {
      const result = await session.run(`
        MATCH (m:Memory {id: $id})-[*1..${depth}]-(related:Memory)
        RETURN related.id as id
      `, { id: memoryId })
      return result.records.map(r => r.get("id"))
    } finally {
      await session.close()
    }
  },

  async deleteMemory(id: string) {
    const session = driver.session()
    try {
      await session.run(`MATCH (m:Memory {id: $id}) DETACH DELETE m`, { id })
    } finally {
      await session.close()
    }
  },

  async deleteByUser(userId: string, appId: string) {
    const session = driver.session()
    try {
      await session.run(`
        MATCH (m:Memory {userId: $userId, appId: $appId})
        DETACH DELETE m
      `, { userId, appId })
    } finally {
      await session.close()
    }
  }
}