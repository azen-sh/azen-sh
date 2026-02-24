import { migrate } from "drizzle-orm/postgres-js/migrator"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is required")

// separate connection for migrations (not the shared pool)
const sql = postgres(connectionString, { max: 1 })
const db = drizzle(sql)

export async function runMigrations() {
  console.log("⏳ Running migrations...")
  await migrate(db, { migrationsFolder: "./db/migrations" })
  console.log("Migrations done")
  await sql.end()
}

// if run directly: bun run db/migrate.ts
if (import.meta.main) {
  await runMigrations()
  process.exit(0)
}