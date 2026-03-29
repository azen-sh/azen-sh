import { test, expect, describe } from "bun:test"
import { Hono } from "hono"
import { healthRouter } from "../../server/src/routes/health"

const app = new Hono()
app.route("/health", healthRouter)

describe("GET /health", () => {
  test("returns 200 with status ok", async () => {
    const res = await app.request("/health")
    expect(res.status).toBe(200)

    const body = (await res.json()) as { status: string; version: string; timestamp: string }
    expect(body.status).toBe("ok")
    expect(body.version).toBe("0.1.0")
    expect(typeof body.timestamp).toBe("string")
  })

  test("returns valid ISO timestamp", async () => {
    const res = await app.request("/health")
    const body = (await res.json()) as { timestamp: string }
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
  })
})
