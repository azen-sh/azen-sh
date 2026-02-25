import { QdrantClient } from "@qdrant/js-client-rest"
import type { VectorStore, VectorSearchResult } from "@azen-sh/types"

const COLLECTION = "azen_memories"

export class QdrantVectorStore implements VectorStore {
  private client: QdrantClient

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL ?? "http://localhost:6333"
    })
  }

  private async ensureCollection(dimensions: number) {
    const { collections } = await this.client.getCollections()
    const exists = collections.some(c => c.name === COLLECTION)
    if (!exists) {
      await this.client.createCollection(COLLECTION, {
        vectors: { size: dimensions, distance: "Cosine" }
      })
    }
  }

  async upsert(id: string, vector: number[]): Promise<void> {
    await this.ensureCollection(vector.length)
    await this.client.upsert(COLLECTION, {
      points: [{ id, vector }]
    })
  }

  async search(query: number[], topK: number): Promise<VectorSearchResult[]> {
    const results = await this.client.search(COLLECTION, {
      vector: query,
      limit: topK,
      with_payload: false
    })
    return results.map(r => ({ id: r.id as string, score: r.score }))
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(COLLECTION, { points: [id] })
  }

  async deleteByUser(userId: string, appId: string): Promise<void> {
    await this.client.delete(COLLECTION, {
      filter: {
        must: [
          { key: "userId", match: { value: userId } },
          { key: "appId", match: { value: appId } }
        ]
      }
    })
  }
}