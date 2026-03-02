import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { MemoryService } from "@azen-sh/core"
import { AddMemoryInputSchema, UpdateMemoryInputSchema } from "@azen-sh/types"

export const memoriesRouter = new Hono()

memoriesRouter.post("/", zValidator("json", AddMemoryInputSchema), async (c) => {
  const memory = await MemoryService.add(c.req.valid("json"))
  return c.json(memory, 201)
})

memoriesRouter.get("/", async (c) => {
  const userId = c.req.query("userId")
  const appId = c.req.query("appId") ?? "default"
  if (!userId) return c.json({ error: "userId required" }, 400)
  return c.json(await MemoryService.list(userId, appId))
})

memoriesRouter.get("/:id", async (c) => {
  const memory = await MemoryService.get(c.req.param("id"))
  if (!memory) return c.json({ error: "Not found" }, 404)
  return c.json(memory)
})

memoriesRouter.patch("/:id", zValidator("json", UpdateMemoryInputSchema), async (c) => {
  const memory = await MemoryService.update(c.req.param("id"), c.req.valid("json"))
  if (!memory) return c.json({ error: "Not found" }, 404)
  return c.json(memory)
})

memoriesRouter.delete("/", async (c) => {
  const userId = c.req.query("userId")
  const appId = c.req.query("appId") ?? "default"
  if (!userId) return c.json({ error: "userId required" }, 400)
  await MemoryService.deleteByUser(userId, appId)
  return c.json({ success: true })
})

memoriesRouter.delete("/:id", async (c) => {
  await MemoryService.delete(c.req.param("id"))
  return c.json({ success: true })
})