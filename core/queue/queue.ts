import { Queue } from "bullmq"
import { redisConnection } from "./redis"
import type { Memory } from "@azen-sh/types"

export type SerializedMemory = Omit<Memory, "createdAt" | "updatedAt" | "expiresAt"> & {
  createdAt: string
  updatedAt: string
  expiresAt?: string
}

type JobMap = {
  "memory.sync": { memoryId: string; content: string; memory: SerializedMemory }
  "memory.update": { memoryId: string; content: string }
  "memory.delete": { memoryId: string }
  "memory.delete-by-user": { userId: string; appId: string }
}

export const memoryQueue = new Queue("memory-fanout", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
})

export function enqueueSync(memoryId: string, content: string, memory: Memory) {
  return memoryQueue.add("memory.sync", {
    memoryId,
    content,
    memory: {
      ...memory,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
      expiresAt: memory.expiresAt?.toISOString(),
    },
  })
}

export function enqueueUpdate(memoryId: string, content: string) {
  return memoryQueue.add("memory.update", { memoryId, content })
}

export function enqueueDelete(memoryId: string) {
  return memoryQueue.add("memory.delete", { memoryId })
}

export function enqueueDeleteByUser(userId: string, appId: string) {
  return memoryQueue.add("memory.delete-by-user", { userId, appId })
}
