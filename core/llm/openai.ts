import OpenAI from "openai"
import type { LLMProvider } from "@azen-sh/types"

export class OpenAILLMProvider implements LLMProvider {
  private client: OpenAI
  private model = process.env.ENTITY_EXTRACTION_MODEL ?? "gpt-4o-mini"

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async complete(prompt: string, system?: string): Promise<string> {
    const messages: OpenAI.ChatCompletionMessageParam[] = []

    if (system) {
      messages.push({ role: "system", content: system })
    }

    messages.push({ role: "user", content: prompt })

    const res = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0,
    })

    const content = res.choices[0]?.message?.content
    if (!content) throw new Error("OpenAI returned empty completion response")
    return content
  }
}
