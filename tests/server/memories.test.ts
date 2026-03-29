import { test, expect, describe, beforeEach, mock } from "bun:test"

function makeMemory(overrides: Record<string, unknown> = {}) {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    userId: "user-1",
    appId: "default",
    content: "test memory",
    metadata: undefined,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    expiresAt: undefined,
    ...overrides,
  }
}

const mockMemoryService = {
  add: mock(() => Promise.resolve(makeMemory())),
  get: mock(() => Promise.resolve(makeMemory())),
  list: mock(() => Promise.resolve([makeMemory()])),
  update: mock(() => Promise.resolve(makeMemory())),
  delete: mock(() => Promise.resolve()),
  deleteByUser: mock(() => Promise.resolve()),
}

const coreMock = () => ({
  MemoryService: mockMemoryService,
  SearchService: {},
  db: {},
  runMigrations: () => {},
  initGraph: () => {},
  startWorker: () => {},
})

// Resolve the actual path Bun uses for @azen-sh/core, then mock both
const coreResolved = new URL(import.meta.resolve("@azen-sh/core")).pathname
mock.module("@azen-sh/core", coreMock)
mock.module(coreResolved, coreMock)

const { Hono } = await import("hono")
const { memoriesRouter } = await import("../../server/src/routes/memories")

const app = new Hono()
app.route("/memories", memoriesRouter)

beforeEach(() => {
  mockMemoryService.add.mockReset()
  mockMemoryService.get.mockReset()
  mockMemoryService.list.mockReset()
  mockMemoryService.update.mockReset()
  mockMemoryService.delete.mockReset()
  mockMemoryService.deleteByUser.mockReset()

  mockMemoryService.add.mockImplementation(() => Promise.resolve(makeMemory()))
  mockMemoryService.get.mockImplementation(() => Promise.resolve(makeMemory()))
  mockMemoryService.list.mockImplementation(() => Promise.resolve([makeMemory()]))
  mockMemoryService.update.mockImplementation(() => Promise.resolve(makeMemory()))
  mockMemoryService.delete.mockImplementation(() => Promise.resolve())
  mockMemoryService.deleteByUser.mockImplementation(() => Promise.resolve())
})

// --- POST /memories ---

describe("POST /memories", () => {
  test("returns 201 on valid input", async () => {
    const res = await app.request("/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-1", content: "hello" }),
    })
    expect(res.status).toBe(201)
    expect(mockMemoryService.add).toHaveBeenCalledTimes(1)
  })

  test("returns 400 on missing content", async () => {
    const res = await app.request("/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-1" }),
    })
    expect(res.status).toBe(400)
    expect(mockMemoryService.add).not.toHaveBeenCalled()
  })

  test("returns 400 on missing userId", async () => {
    const res = await app.request("/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "hello" }),
    })
    expect(res.status).toBe(400)
    expect(mockMemoryService.add).not.toHaveBeenCalled()
  })
})

// --- GET /memories ---

describe("GET /memories", () => {
  test("returns 400 when userId is missing", async () => {
    const res = await app.request("/memories")
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("userId required")
  })

  test("returns 200 with valid userId", async () => {
    const res = await app.request("/memories?userId=user-1")
    expect(res.status).toBe(200)
    expect(mockMemoryService.list).toHaveBeenCalledTimes(1)
  })

  test("passes default appId, limit, offset to service", async () => {
    await app.request("/memories?userId=user-1")
    expect(mockMemoryService.list).toHaveBeenCalledWith("user-1", "default", 20, 0)
  })

  test("passes custom appId, limit, offset", async () => {
    await app.request("/memories?userId=user-1&appId=myapp&limit=50&offset=10")
    expect(mockMemoryService.list).toHaveBeenCalledWith("user-1", "myapp", 50, 10)
  })

  test("clamps limit to max 100", async () => {
    await app.request("/memories?userId=user-1&limit=999")
    expect(mockMemoryService.list).toHaveBeenCalledWith("user-1", "default", 100, 0)
  })

  test("clamps limit to min 1", async () => {
    await app.request("/memories?userId=user-1&limit=0")
    expect(mockMemoryService.list).toHaveBeenCalledWith("user-1", "default", 1, 0)
  })

  test("clamps offset to min 0", async () => {
    await app.request("/memories?userId=user-1&offset=-5")
    expect(mockMemoryService.list).toHaveBeenCalledWith("user-1", "default", 20, 0)
  })
})

// --- GET /memories/:id ---

describe("GET /memories/:id", () => {
  test("returns 200 for valid UUID", async () => {
    const res = await app.request("/memories/550e8400-e29b-41d4-a716-446655440000")
    expect(res.status).toBe(200)
  })

  test("returns 400 for invalid UUID", async () => {
    const res = await app.request("/memories/not-a-uuid")
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("Invalid id format")
  })

  test("returns 404 when memory not found", async () => {
    mockMemoryService.get.mockImplementation((() => Promise.resolve(null)) as never)
    const res = await app.request("/memories/550e8400-e29b-41d4-a716-446655440000")
    expect(res.status).toBe(404)
  })
})

// --- PATCH /memories/:id ---

describe("PATCH /memories/:id", () => {
  test("returns 200 on valid update", async () => {
    const res = await app.request("/memories/550e8400-e29b-41d4-a716-446655440000", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "updated" }),
    })
    expect(res.status).toBe(200)
    expect(mockMemoryService.update).toHaveBeenCalledTimes(1)
  })

  test("returns 400 for invalid UUID", async () => {
    const res = await app.request("/memories/bad-id", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "updated" }),
    })
    expect(res.status).toBe(400)
  })

  test("returns 400 for empty body", async () => {
    const res = await app.request("/memories/550e8400-e29b-41d4-a716-446655440000", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  test("returns 404 when memory not found", async () => {
    mockMemoryService.update.mockImplementation((() => Promise.resolve(null)) as never)
    const res = await app.request("/memories/550e8400-e29b-41d4-a716-446655440000", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "updated" }),
    })
    expect(res.status).toBe(404)
  })
})

// --- DELETE /memories ---

describe("DELETE /memories (bulk)", () => {
  test("returns 400 when userId is missing", async () => {
    const res = await app.request("/memories", { method: "DELETE" })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("userId required")
  })

  test("returns 200 with valid userId", async () => {
    const res = await app.request("/memories?userId=user-1", { method: "DELETE" })
    expect(res.status).toBe(200)
    expect(mockMemoryService.deleteByUser).toHaveBeenCalledWith("user-1", "default")
  })

  test("passes custom appId", async () => {
    await app.request("/memories?userId=user-1&appId=myapp", { method: "DELETE" })
    expect(mockMemoryService.deleteByUser).toHaveBeenCalledWith("user-1", "myapp")
  })
})

// --- DELETE /memories/:id ---

describe("DELETE /memories/:id", () => {
  test("returns 200 for valid UUID", async () => {
    const res = await app.request("/memories/550e8400-e29b-41d4-a716-446655440000", {
      method: "DELETE",
    })
    expect(res.status).toBe(200)
    expect(mockMemoryService.delete).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000")
  })

  test("returns 400 for invalid UUID", async () => {
    const res = await app.request("/memories/bad-id", { method: "DELETE" })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("Invalid id format")
  })
})
