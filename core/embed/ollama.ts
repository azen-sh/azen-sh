import type { EmbeddingProvider } from "@azen-sh/types"

export class OllamaEmbedding implements EmbeddingProvider {
  private baseUrl = process.env.EMBEDDING_BASE_URL ?? "http://localhost:11434"
  private model = process.env.EMBEDDING_MODEL ?? "nomic-embed-text"

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt: text })
    })
    const data = await res.json() as { embedding: number[] }
    return data.embedding
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
      return Promise.all(texts.map(t => this.embed(t)))
  }
}