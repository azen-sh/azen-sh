import { driver } from "./client"
import type { Memory } from "@azen-sh/types"
import type { ExtractedEntity } from "./entities"

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

  async addEntities(
    memoryId: string,
    userId: string,
    appId: string,
    entities: ExtractedEntity[]
  ) {
    if (entities.length === 0) return
    const session = driver.session()
    try {
      for (const entity of entities) {
        await session.run(`
          MATCH (m:Memory {id: $memoryId})
          MERGE (e:Entity {name: $name, type: $type, userId: $userId, appId: $appId})
          MERGE (m)-[:HAS_ENTITY {relation: $relation}]->(e)
        `, {
          memoryId,
          name: entity.name,
          type: entity.type,
          userId,
          appId,
          relation: entity.relation,
        })
      }
    } finally {
      await session.close()
    }
  },

  async getRelatedViaEntities(
    memoryIds: string[],
    limit: number = 10
  ): Promise<string[]> {
    if (memoryIds.length === 0) return []
    const session = driver.session()
    try {
      const result = await session.run(`
        MATCH (m:Memory)-[:HAS_ENTITY]->(e:Entity)<-[:HAS_ENTITY]-(related:Memory)
        WHERE m.id IN $memoryIds AND NOT related.id IN $memoryIds
        RETURN related.id AS id, count(DISTINCT e) AS sharedCount
        ORDER BY sharedCount DESC
        LIMIT toInteger($limit)
      `, { memoryIds, limit })
      return result.records.map(r => r.get("id") as string)
    } finally {
      await session.close()
    }
  },

  async clearEntities(memoryId: string) {
    const session = driver.session()
    try {
      // Remove HAS_ENTITY relationships, then clean up orphan entities
      await session.run(`
        MATCH (m:Memory {id: $memoryId})-[r:HAS_ENTITY]->(e:Entity)
        DELETE r
        WITH e
        WHERE NOT (e)<-[:HAS_ENTITY]-()
        DELETE e
      `, { memoryId })
    } finally {
      await session.close()
    }
  },

  async deleteMemory(id: string) {
    const session = driver.session()
    try {
      // Clean up orphan entities before deleting the memory
      await session.run(`
        MATCH (m:Memory {id: $id})-[:HAS_ENTITY]->(e:Entity)
        WHERE size([(other)-[:HAS_ENTITY]->(e) WHERE other.id <> $id | other]) = 0
        DETACH DELETE e
      `, { id })
      await session.run(`MATCH (m:Memory {id: $id}) DETACH DELETE m`, { id })
    } finally {
      await session.close()
    }
  },

  async deleteByUser(userId: string, appId: string) {
    const session = driver.session()
    try {
      // Delete entities scoped to this user+app, then memories
      await session.run(`
        MATCH (e:Entity {userId: $userId, appId: $appId})
        DETACH DELETE e
      `, { userId, appId })
      await session.run(`
        MATCH (m:Memory {userId: $userId, appId: $appId})
        DETACH DELETE m
      `, { userId, appId })
    } finally {
      await session.close()
    }
  }
}