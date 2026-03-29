import { test, expect, describe, mock } from "bun:test"

const mockSearchService = {
  semantic: mock(() => Promise.resolve([])),
}

const coreMock = () => ({
  SearchService: mockSearchService,
  MemoryService: {},
  db: {},
  runMigrations: () => {},
  initGraph: () => {},
  startWorker: () => {},
})

const coreResolved = new URL(import.meta.resolve("@azen-sh/core")).pathname
mock.module("@azen-sh/core", coreMock)
mock.module(coreResolved, coreMock)

const { Hono } = await import("hono")
const { searchRouter } = await import("../../server/src/routes/search")

const app = new Hono()
app.route("/search", searchRouter)

describe("POST /search", () => {
  test("returns 200 on valid input", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "hello", userId: "user-1" }),
    })
    expect(res.status).toBe(200)
    expect(mockSearchService.semantic).toHaveBeenCalledTimes(1)
  })

  test("returns 400 on missing query", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-1" }),
    })
    expect(res.status).toBe(400)
  })

  test("returns 400 on missing userId", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "hello" }),
    })
    expect(res.status).toBe(400)
  })

  test("returns 400 on query over 5000 chars", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "a".repeat(5001), userId: "user-1" }),
    })
    expect(res.status).toBe(400)
  })

  test("returns 400 on invalid topK", async () => {
    const res = await app.request("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "hello", userId: "user-1", topK: 0 }),
    })
    expect(res.status).toBe(400)
  })
})
