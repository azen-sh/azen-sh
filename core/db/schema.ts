import { pgTable, text, uuid, timestamp, jsonb, index } from "drizzle-orm/pg-core"
import { vector } from "drizzle-orm/pg-core"

export const memories = pgTable("memories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  appId: text("app_id").notNull().default("default"),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (t) => ({
  userIdIdx: index("memories_user_id_idx").on(t.userId),
  appIdIdx: index("memories_app_id_idx").on(t.appId),
  userAppIdx: index("memories_user_app_idx").on(t.userId, t.appId),
}))

export type MemoryRow = typeof memories.$inferSelect
export type NewMemoryRow = typeof memories.$inferInsert