import { tool } from "ai"
import { z } from "zod"

interface AzenToolsConfig {
  userId: string
  appId?: string
  apiUrl?: string
}

async function request(apiUrl: string, path: string, options?: RequestInit) {
  const res = await fetch(`${apiUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { error?: string }).error ?? `Azen request failed: ${res.status}`
    )
  }
  return res.json()
}

export function azenTools(config: AzenToolsConfig) {
  const apiUrl = config.apiUrl ?? "http://localhost:3000"
  const userId = config.userId
  const appId = config.appId ?? "default"

  return {
    addMemory: tool({
      description: "Store a memory for later recall. Use this when the user shares a preference, fact, or anything worth remembering across conversations.",
      parameters: z.object({
        content: z.string().describe("The memory content to store"),
        metadata: z.record(z.string(), z.unknown()).optional().describe("Optional key-value metadata"),
      }),
      execute: async ({ content, metadata }) => {
        const memory = await request(apiUrl, "/memories", {
          method: "POST",
          body: JSON.stringify({ userId, appId, content, metadata }),
        })
        return { success: true, memoryId: (memory as { id: string }).id }
      },
    }),

    searchMemories: tool({
      description: "Search stored memories by meaning. Use this to recall previously stored information relevant to the current conversation.",
      parameters: z.object({
        query: z.string().describe("What to search for"),
        topK: z.number().min(1).max(50).default(5).describe("Number of results to return"),
      }),
      execute: async ({ query, topK }) => {
        return request(apiUrl, "/search", {
          method: "POST",
          body: JSON.stringify({ query, userId, appId, topK }),
        })
      },
    }),

    listMemories: tool({
      description: "List stored memories for the current user. Use this to browse what has been remembered.",
      parameters: z.object({
        limit: z.number().min(1).max(100).default(20).describe("Number of memories to return"),
        offset: z.number().min(0).default(0).describe("Offset for pagination"),
      }),
      execute: async ({ limit, offset }) => {
        const qs = new URLSearchParams({ userId, appId, limit: String(limit), offset: String(offset) })
        return request(apiUrl, `/memories?${qs.toString()}`)
      },
    }),

    getMemory: tool({
      description: "Get a specific memory by its ID.",
      parameters: z.object({
        id: z.string().describe("The memory ID (UUID)"),
      }),
      execute: async ({ id }) => {
        return request(apiUrl, `/memories/${id}`)
      },
    }),

    updateMemory: tool({
      description: "Update an existing memory's content or metadata.",
      parameters: z.object({
        id: z.string().describe("The memory ID (UUID) to update"),
        content: z.string().optional().describe("New content for the memory"),
        metadata: z.record(z.string(), z.unknown()).optional().describe("New metadata"),
      }),
      execute: async ({ id, content, metadata }) => {
        return request(apiUrl, `/memories/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ content, metadata }),
        })
      },
    }),

    deleteMemory: tool({
      description: "Delete a specific memory by its ID. Use this when the user asks to forget something.",
      parameters: z.object({
        id: z.string().describe("The memory ID (UUID) to delete"),
      }),
      execute: async ({ id }) => {
        return request(apiUrl, `/memories/${id}`, { method: "DELETE" })
      },
    }),

    deleteAllMemories: tool({
      description: "Delete all memories for the current user. Use this only when the user explicitly asks to clear all their memories.",
      parameters: z.object({}),
      execute: async () => {
        const qs = new URLSearchParams({ userId, appId })
        return request(apiUrl, `/memories?${qs.toString()}`, { method: "DELETE" })
      },
    }),
  }
}
