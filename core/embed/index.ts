import type { EmbeddingProvider } from "@azen-sh/types";
import { OllamaEmbedding } from "./ollama";
import { OpenAIEmbedding } from "./openai";

function createProvider(): EmbeddingProvider {
    const provider = process.env.EMBEDDING_PROVIDER ?? "ollama";
    switch (provider) {
        case "ollama": return new OllamaEmbedding()
        case "openai":
        case "custom":
          if(provider === "openai" && !process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY required when EMBEDDING_PROVIDER=openai")
        }
        return new OpenAIEmbedding()
        default:
            throw new Error(`Unknown embedding provider: ${provider}`)
    }
};

export const embeddingProvider = createProvider();