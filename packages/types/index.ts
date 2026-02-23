import { z } from "zod"

//Memory - 
export const MemorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  appId: z.string().default("default"),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(),
})

export type Memory = z.infer<typeof MemorySchema>

//Inputs - 
export const AddMemoryInputSchema = z.object({
  userId: z.string(),
  appId: z.string().default("default"),
  content: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.date().optional(),
})

export const UpdateMemoryInputSchema = z.object({
  content: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const SearchInputSchema = z.object({
  query: z.string().min(1),
  userId: z.string(),
  appId: z.string().default("default"),
  topK: z.number().default(10),
  filter: z.record(z.string(), z.unknown()).optional(),
})

export type AddMemoryInput = z.infer<typeof AddMemoryInputSchema>
export type UpdateMemoryInput = z.infer<typeof UpdateMemoryInputSchema>
export type SearchInput = z.infer<typeof SearchInputSchema>

//Results - 

export type SearchResult = {
    memory: Memory
    score: number
};

export interface EmbeddingProvider {
    embed(text: string): Promise<number[]>
    embedBatch(texts: string[]): Promise<number[][]>
}

export interface VectorStore {
    upsert(id: string, vector: number[]): Promise<void>
    search(vector: number[], topK: number): Promise<VectorSearchResult[]>
    delete(id: string): Promise<void>
    deleteByUser(userId: string, appId: string): Promise<void>
}

export interface VectorSearchResult {
    id: string
    score: number
}

export interface GraphStore {
    addMemory(memory: Memory): Promise<void>
    getRelated(memoryId: string, depth?: number): Promise<string[]>
    deleteMemory(id: string): Promise<void>
    deleteByUser(userId: string, appId: string): Promise<void>
}

export interface LLMProvider {
    complete(prompt: string, system?: string): Promise<string>
}

//config types - 
export type VectorStoreType = "pgvector" | "qdrant" | "pinecone" | "weaviate" | "chroma"
export type EmbeddingProviderType = "ollama" | "openai" | "custom"
export type LLMProviderType = "ollama" | "openai" | "custom"