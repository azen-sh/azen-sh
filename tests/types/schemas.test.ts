import { test, expect, describe } from "bun:test"
import {
  MemorySchema,
  AddMemoryInputSchema,
  UpdateMemoryInputSchema,
  SearchInputSchema,
} from "../../packages/types/index"

// --- AddMemoryInputSchema ---

describe("AddMemoryInputSchema", () => {
  test("accepts valid input with defaults", () => {
    const result = AddMemoryInputSchema.safeParse({
      userId: "user-1",
      content: "hello world",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.appId).toBe("default")
      expect(result.data.metadata).toBeUndefined()
      expect(result.data.expiresAt).toBeUndefined()
    }
  })

  test("accepts custom appId and metadata", () => {
    const result = AddMemoryInputSchema.safeParse({
      userId: "user-1",
      appId: "my-app",
      content: "hello",
      metadata: { key: "value", nested: { a: 1 } },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.appId).toBe("my-app")
      expect(result.data.metadata).toEqual({ key: "value", nested: { a: 1 } })
    }
  })

  test("coerces expiresAt string to Date", () => {
    const result = AddMemoryInputSchema.safeParse({
      userId: "user-1",
      content: "hello",
      expiresAt: "2025-12-31T00:00:00Z",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.expiresAt).toBeInstanceOf(Date)
    }
  })

  test("rejects missing userId", () => {
    expect(AddMemoryInputSchema.safeParse({ content: "hello" }).success).toBe(false)
  })

  test("rejects missing content", () => {
    expect(AddMemoryInputSchema.safeParse({ userId: "user-1" }).success).toBe(false)
  })

  test("rejects empty userId", () => {
    expect(
      AddMemoryInputSchema.safeParse({ userId: "", content: "hello" }).success
    ).toBe(false)
  })

  test("rejects empty content", () => {
    expect(
      AddMemoryInputSchema.safeParse({ userId: "user-1", content: "" }).success
    ).toBe(false)
  })

  test("rejects userId over 255 chars", () => {
    expect(
      AddMemoryInputSchema.safeParse({ userId: "a".repeat(256), content: "hello" }).success
    ).toBe(false)
  })

  test("rejects content over 100k chars", () => {
    expect(
      AddMemoryInputSchema.safeParse({ userId: "user-1", content: "a".repeat(100_001) }).success
    ).toBe(false)
  })

  test("accepts content at exactly 100k chars", () => {
    expect(
      AddMemoryInputSchema.safeParse({ userId: "user-1", content: "a".repeat(100_000) }).success
    ).toBe(true)
  })
})

// --- UpdateMemoryInputSchema ---

describe("UpdateMemoryInputSchema", () => {
  test("accepts content only", () => {
    expect(UpdateMemoryInputSchema.safeParse({ content: "updated" }).success).toBe(true)
  })

  test("accepts metadata only", () => {
    expect(UpdateMemoryInputSchema.safeParse({ metadata: { k: "v" } }).success).toBe(true)
  })

  test("accepts both content and metadata", () => {
    expect(
      UpdateMemoryInputSchema.safeParse({ content: "updated", metadata: { k: "v" } }).success
    ).toBe(true)
  })

  test("rejects empty object — at least one field required", () => {
    expect(UpdateMemoryInputSchema.safeParse({}).success).toBe(false)
  })

  test("rejects content over 100k chars", () => {
    expect(
      UpdateMemoryInputSchema.safeParse({ content: "a".repeat(100_001) }).success
    ).toBe(false)
  })
})

// --- SearchInputSchema ---

describe("SearchInputSchema", () => {
  test("accepts valid input with defaults", () => {
    const result = SearchInputSchema.safeParse({
      query: "find something",
      userId: "user-1",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.topK).toBe(10)
      expect(result.data.appId).toBe("default")
      expect(result.data.filter).toBeUndefined()
    }
  })

  test("accepts custom topK and filter", () => {
    const result = SearchInputSchema.safeParse({
      query: "hello",
      userId: "user-1",
      topK: 50,
      filter: { category: "notes" },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.topK).toBe(50)
      expect(result.data.filter).toEqual({ category: "notes" })
    }
  })

  test("rejects topK below 1", () => {
    expect(
      SearchInputSchema.safeParse({ query: "q", userId: "u", topK: 0 }).success
    ).toBe(false)
  })

  test("rejects topK above 100", () => {
    expect(
      SearchInputSchema.safeParse({ query: "q", userId: "u", topK: 101 }).success
    ).toBe(false)
  })

  test("rejects non-integer topK", () => {
    expect(
      SearchInputSchema.safeParse({ query: "q", userId: "u", topK: 5.5 }).success
    ).toBe(false)
  })

  test("rejects missing query", () => {
    expect(SearchInputSchema.safeParse({ userId: "u" }).success).toBe(false)
  })

  test("rejects missing userId", () => {
    expect(SearchInputSchema.safeParse({ query: "q" }).success).toBe(false)
  })

  test("rejects query over 5000 chars", () => {
    expect(
      SearchInputSchema.safeParse({ query: "a".repeat(5001), userId: "u" }).success
    ).toBe(false)
  })
})

// --- MemorySchema (output validation) ---

describe("MemorySchema", () => {
  const valid = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    userId: "user-1",
    appId: "default",
    content: "hello world",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  }

  test("accepts valid memory", () => {
    expect(MemorySchema.safeParse(valid).success).toBe(true)
  })

  test("coerces date strings to Date objects", () => {
    const result = MemorySchema.safeParse(valid)
    if (result.success) {
      expect(result.data.createdAt).toBeInstanceOf(Date)
      expect(result.data.updatedAt).toBeInstanceOf(Date)
    }
  })

  test("rejects invalid UUID", () => {
    expect(MemorySchema.safeParse({ ...valid, id: "not-a-uuid" }).success).toBe(false)
  })

  test("accepts optional metadata and expiresAt", () => {
    const result = MemorySchema.safeParse({
      ...valid,
      metadata: { foo: "bar" },
      expiresAt: "2026-01-01T00:00:00Z",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.metadata).toEqual({ foo: "bar" })
      expect(result.data.expiresAt).toBeInstanceOf(Date)
    }
  })
})
