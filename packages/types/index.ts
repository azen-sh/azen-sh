import { z } from "zod"

//Memory - 
export const MemorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1).max(255),
  appId: z.string().min(1).max(255).default("default"),
  content: z.string().min(1).max(100_000),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiresAt: z.coerce.date().optional(),
})

export type Memory = z.infer<typeof MemorySchema>

//Inputs - 
export const AddMemoryInputSchema = z.object({
  userId: z.string().min(1).max(255),
  appId: z.string().min(1).max(255).default("default"),
  content: z.string().min(1).max(100_000),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.coerce.date().optional(),
})

export const UpdateMemoryInputSchema = z.object({
  content: z.string().min(1).max(100_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => data.content !== undefined || data.metadata !== undefined,
  { message: "At least one of content or metadata is required" }
)

export const SearchInputSchema = z.object({
  query: z.string().min(1).max(5000),
  userId: z.string().min(1).max(255),
  appId: z.string().min(1).max(255).default("default"),
  topK: z.number().int().min(1).max(100).default(10),
  filter: z.record(z.string(), z.unknown()).optional(),
  includeGraph: z.boolean().default(true).optional(),
})

export type AddMemoryInput = z.infer<typeof AddMemoryInputSchema>
export type UpdateMemoryInput = z.infer<typeof UpdateMemoryInputSchema>
export type SearchInput = z.infer<typeof SearchInputSchema>

//Results - 

export type SearchResult = {
    memory: Memory
    score: number
    source?: "vector" | "graph"
};

export interface EmbeddingProvider {
    embed(text: string): Promise<number[]>
    embedBatch(texts: string[]): Promise<number[][]>
}

export interface VectorSearchFilter {
    userId: string
    appId: string
}

export interface VectorStore {
    upsert(id: string, vector: number[], metadata: { userId: string; appId: string }): Promise<void>
    search(vector: number[], topK: number, filter: VectorSearchFilter): Promise<VectorSearchResult[]>
    delete(id: string): Promise<void>
    deleteByUser(userId: string, appId: string): Promise<void>
}

export interface VectorSearchResult {
    id: string
    score: number
}

export interface GraphStore {
    addMemory(memory: Memory): Promise<void>
    updateMemoryContent(memoryId: string, content: string): Promise<void>
    getRelated(memoryId: string, depth?: number): Promise<string[]>
    addEntities(memoryId: string, userId: string, appId: string, entities: { name: string; type: string; relation: string }[]): Promise<void>
    getRelatedViaEntities(memoryIds: string[], limit?: number): Promise<string[]>
    clearEntities(memoryId: string): Promise<void>
    deleteMemory(id: string): Promise<void>
    deleteByUser(userId: string, appId: string): Promise<void>
}

export interface LLMProvider {
    complete(prompt: string, system?: string): Promise<string>
}

//config types - 
export type VectorStoreType = "pgvector" | "qdrant" | "pinecone" | "weaviate" | "chroma"
export type EmbeddingProviderType = "openai" | "custom"
export type LLMProviderType = "openai" | "custom"