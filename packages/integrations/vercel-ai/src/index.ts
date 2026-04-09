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
        const results = await request(apiUrl, "/search", {
          method: "POST",
          body: JSON.stringify({ query, userId, appId, topK }),
        })
        return results
      },
    }),
  }
}
