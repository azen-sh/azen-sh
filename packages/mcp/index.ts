#!/usr/bin/env bun

/**
 * Azen MCP Server
 *
 * This is an MCP (Model Context Protocol) server that lets AI tools like
 * Claude Desktop, Cursor, etc. talk to your Azen memory API.
 *
 * How it works:
 * - The AI tool launches this script as a subprocess
 * - Communication happens over stdio (stdin/stdout) using JSON-RPC messages
 * - This server exposes "tools" that the AI can call (add_memory, search, etc.)
 * - Each tool makes an HTTP request to your running Azen API
 *
 * The AI tool doesn't need to know about REST endpoints — it just sees
 * named tools with typed inputs, and the MCP server handles the rest.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

// --- Configuration ---
// AZEN_URL points to your running Azen API instance.
// Defaults to localhost:3000 (what docker compose starts).
const AZEN_URL = process.env.AZEN_URL ?? "http://localhost:3000"

/**
 * Helper to make requests to the Azen API.
 * Every tool below uses this to talk to your REST API.
 */
async function azenFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${AZEN_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
}

// --- Create the MCP server ---
// McpServer is the high-level API from the MCP SDK.
// We give it a name and version — this is what the AI tool sees when it connects.
const server = new McpServer({
  name: "azen-memory",
  version: "0.1.0",
})

// --- Tool: add_memory ---
// Lets the AI store a new memory in Azen.
// Example: Claude decides "the user prefers dark mode" and stores it.
server.registerTool("add_memory", {
  description: "Store a new memory. Use this to save information that should be remembered for later.",
  inputSchema: {
    userId: z.string().describe("The user ID to store the memory for"),
    content: z.string().describe("The memory content to store"),
    appId: z.string().optional().describe("App ID to scope the memory (defaults to 'default')"),
    metadata: z.record(z.string(), z.unknown()).optional().describe("Optional key-value metadata"),
  },
}, async ({ userId, content, appId, metadata }) => {
  // Calls POST /memories on your Azen API — same as a curl request would
  const res = await azenFetch("/memories", {
    method: "POST",
    body: JSON.stringify({ userId, content, appId, metadata }),
  })

  if (!res.ok) {
    const err = await res.json() as { error?: string }
    return {
      content: [{ type: "text" as const, text: `Error: ${err.error ?? res.statusText}` }],
      isError: true,
    }
  }

  const memory = await res.json()
  return {
    content: [{ type: "text" as const, text: JSON.stringify(memory, null, 2) }],
  }
})

// --- Tool: search_memories ---
// Lets the AI semantically search stored memories.
// Example: Claude needs to recall "what does the user prefer?" and searches for it.
// This uses vector embeddings under the hood — the AI just passes a query string.
server.registerTool("search_memories", {
  description: "Semantically search stored memories. Returns the most relevant memories matching the query.",
  inputSchema: {
    query: z.string().describe("The search query — what are you looking for?"),
    userId: z.string().describe("The user ID to search memories for"),
    appId: z.string().optional().describe("App ID to scope the search (defaults to 'default')"),
    topK: z.number().int().min(1).max(100).optional().describe("Max number of results (default 10)"),
  },
}, async ({ query, userId, appId, topK }) => {
  // Calls POST /search on your Azen API
  const res = await azenFetch("/search", {
    method: "POST",
    body: JSON.stringify({ query, userId, appId, topK }),
  })

  if (!res.ok) {
    const err = await res.json() as { error?: string }
    return {
      content: [{ type: "text" as const, text: `Error: ${err.error ?? res.statusText}` }],
      isError: true,
    }
  }

  const results = await res.json()
  return {
    content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
  }
})

// --- Tool: list_memories ---
// Lets the AI list all memories for a user (with pagination).
// Useful when the AI wants to see everything stored, not search for something specific.
server.registerTool("list_memories", {
  description: "List all memories for a user. Returns a paginated list.",
  inputSchema: {
    userId: z.string().describe("The user ID to list memories for"),
    appId: z.string().optional().describe("App ID to scope the list (defaults to 'default')"),
    limit: z.number().int().min(1).max(100).optional().describe("Max results per page (default 20)"),
    offset: z.number().int().min(0).optional().describe("Offset for pagination (default 0)"),
  },
}, async ({ userId, appId, limit, offset }) => {
  // Builds query params and calls GET /memories
  const params = new URLSearchParams({ userId })
  if (appId) params.set("appId", appId)
  if (limit) params.set("limit", String(limit))
  if (offset) params.set("offset", String(offset))

  const res = await azenFetch(`/memories?${params}`)

  if (!res.ok) {
    const err = await res.json() as { error?: string }
    return {
      content: [{ type: "text" as const, text: `Error: ${err.error ?? res.statusText}` }],
      isError: true,
    }
  }

  const memories = await res.json()
  return {
    content: [{ type: "text" as const, text: JSON.stringify(memories, null, 2) }],
  }
})

// --- Tool: delete_memory ---
// Lets the AI delete a specific memory by ID.
// Example: Claude realizes a stored memory is outdated and removes it.
server.registerTool("delete_memory", {
  description: "Delete a memory by its ID.",
  inputSchema: {
    id: z.string().uuid().describe("The memory ID to delete"),
  },
}, async ({ id }) => {
  // Calls DELETE /memories/:id on your Azen API
  const res = await azenFetch(`/memories/${id}`, { method: "DELETE" })

  if (!res.ok) {
    const err = await res.json() as { error?: string }
    return {
      content: [{ type: "text" as const, text: `Error: ${err.error ?? res.statusText}` }],
      isError: true,
    }
  }

  return {
    content: [{ type: "text" as const, text: `Memory ${id} deleted.` }],
  }
})

// --- Start the server ---
// StdioServerTransport reads JSON-RPC messages from stdin and writes responses to stdout.
// The AI tool (Claude Desktop, Cursor, etc.) launches this script and communicates over these pipes.
// console.error is used for logging because stdout is reserved for MCP protocol messages.
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("Azen MCP server running on stdio")
}

main().catch((err) => {
  console.error("Failed to start MCP server:", err)
  process.exit(1)
})
