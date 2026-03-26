import { Worker } from "bullmq"
import { redisConnection } from "./redis"
import type { SerializedMemory } from "./queue"
import { embeddingProvider } from "../embed"
import { vectorStore } from "../vectors"
import { graphOps } from "../graph/operations"

function deserializeMemory(m: SerializedMemory) {
  return {
    ...m,
    createdAt: new Date(m.createdAt),
    updatedAt: new Date(m.updatedAt),
    expiresAt: m.expiresAt ? new Date(m.expiresAt) : undefined,
  }
}

export function startWorker() {
  const worker = new Worker(
    "memory-fanout",
    async (job) => {
      switch (job.name) {
        case "memory.sync": {
          const { memoryId, content, memory } = job.data
          const vector = await embeddingProvider.embed(content)
          await vectorStore.upsert(memoryId, vector, { userId: memory.userId, appId: memory.appId })
          await graphOps.addMemory(deserializeMemory(memory))
          break
        }
        case "memory.update": {
          const { memoryId, content, userId, appId } = job.data
          const vector = await embeddingProvider.embed(content)
          await vectorStore.upsert(memoryId, vector, { userId, appId })
          break
        }
        case "memory.delete": {
          const { memoryId } = job.data
          await vectorStore.delete(memoryId)
          await graphOps.deleteMemory(memoryId)
          break
        }
        case "memory.delete-by-user": {
          const { userId, appId } = job.data
          await vectorStore.deleteByUser(userId, appId)
          await graphOps.deleteByUser(userId, appId)
          break
        }
      }
    },
    { connection: redisConnection, concurrency: 5 },
  )

  worker.on("failed", (job, err) => {
    console.error(`[worker] Job ${job?.name}#${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
  })

  console.log("✅ Memory fan-out worker started")
  return worker
}
