import OpenAI from "openai"
import type { EmbeddingProvider } from "@azen-sh/types"

export class OpenAIEmbedding implements EmbeddingProvider {
  private client: OpenAI
  private model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small"

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.EMBEDDING_BASE_URL
    })
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: this.model,
      input: text
    })
    return res.data[0]!.embedding
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await this.client.embeddings.create({
      model: this.model,
      input: texts
    })
    return res.data.map(d => d.embedding)
  }
}