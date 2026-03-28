import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { runMigrations, initGraph, startWorker } from "@azen-sh/core"
import { memoriesRouter } from "./routes/memories"
import { searchRouter } from "./routes/search"
import { healthRouter } from "./routes/health"

await runMigrations()
await initGraph()
startWorker()

const app = new Hono()

app.use("*", cors())
app.use("*", logger())

app.route("/health", healthRouter)
app.route("/memories", memoriesRouter)
app.route("/search", searchRouter)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "Internal server error" }, 500)
})

export default {
  port: process.env.PORT ?? 3000,
  fetch: app.fetch
}

console.log(`🚀 Running on http://localhost:${process.env.PORT ?? 3000}`)