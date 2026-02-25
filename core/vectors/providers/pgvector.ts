import type { VectorSearchResult, VectorStore } from "@azen-sh/types";
import { db } from "../../db/client";
import { sql } from "drizzle-orm";

export class PgVectorStore implements VectorStore {
  async upsert(id: string, vector: number[]): Promise<void> {
    await db.execute(sql`
      UPDATE memories
      SET embedding = ${JSON.stringify(vector)}::vector
      WHERE id = ${id}
    `);
  }

  async search(query: number[], topK: number): Promise<VectorSearchResult[]> {
    const result = await db.execute(sql`
      SELECT id, 1 - (embedding <=> ${JSON.stringify(query)}::vector) as score
      FROM memories
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${JSON.stringify(query)}::vector
      LIMIT ${topK}
    `);

    const rows = result as unknown as { id: string; score: number }[];
    return rows.map(r => ({
      id: r.id,
      score: Number(r.score)
    }));
  }

  async delete(id: string): Promise<void> {
    await db.execute(sql`UPDATE memories SET embedding = NULL WHERE id = ${id}`);
  }

  async deleteByUser(userId: string, appId: string): Promise<void> {
    await db.execute(sql`
      UPDATE memories SET embedding = NULL
      WHERE user_id = ${userId} AND app_id = ${appId}
    `);
  }
}
