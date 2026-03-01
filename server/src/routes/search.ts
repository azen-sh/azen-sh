import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { SearchService } from "@azen-sh/core"
import { SearchInputSchema } from "@azen-sh/types"

export const searchRouter = new Hono()

searchRouter.post("/", zValidator("json", SearchInputSchema), async (c) => {
  const results = await SearchService.semantic(c.req.valid("json"))
  return c.json(results)
})