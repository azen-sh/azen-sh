# @azen-sh/vercel-ai

Vercel AI SDK integration for [Azen](https://github.com/azen-sh/azen-sh) — gives your LLM tools to store and search memories.

## Install

> Not yet published to npm. For now, copy `src/index.ts` into your project (e.g. `lib/azen.ts`). It only depends on `ai` and `zod`, which you'll already have if you're using the Vercel AI SDK.

```bash
# once published:
npm install @azen-sh/vercel-ai
```

Peer dependency: `ai` >= 4.0.0

## Usage

Pass `azenTools()` to any `generateText` or `streamText` call. The LLM decides when to store and recall memories on its own.

```ts
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { azenTools } from "@azen-sh/vercel-ai"

const result = await generateText({
  model: openai("gpt-4o"),
  system: "You are a helpful assistant. Use your memory tools to remember and recall user preferences.",
  prompt: "I'm allergic to peanuts.",
  tools: azenTools({
    userId: "user_123",
    apiUrl: "http://localhost:3000",  // your Azen instance
  }),
  maxSteps: 3,
})

console.log(result.text)
// "Got it, I'll remember that you're allergic to peanuts."
```

## Configuration

```ts
azenTools({
  userId: "user_123",           // required — scopes memories to this user
  appId: "my-app",              // optional — defaults to "default"
  apiUrl: "http://localhost:3000", // optional — defaults to "http://localhost:3000"
})
```

## Tools provided

| Tool | What the LLM uses it for |
|---|---|
| `addMemory` | Store a new memory (preference, fact, context) for later recall |
| `searchMemories` | Search stored memories by meaning to recall relevant information |
| `listMemories` | Browse stored memories with pagination |
| `getMemory` | Get a specific memory by its ID |
| `updateMemory` | Update content or metadata of an existing memory |
| `deleteMemory` | Delete a specific memory (e.g. "forget that") |
| `deleteAllMemories` | Clear all memories for the user (only when explicitly asked) |

## How it works

1. You pass `azenTools()` as `tools` in your `generateText` / `streamText` call
2. The LLM reads the tool descriptions and decides when to call them
3. When the LLM calls `addMemory`, the integration sends `POST /memories` to your Azen API
4. When the LLM calls `searchMemories`, it sends `POST /search` and gets back relevant memories with relevance scores
5. The LLM uses the results to inform its response

The integration talks to the Azen REST API over HTTP — it doesn't import the core engine, so it works with any running Azen instance.

## Requirements

- An Azen API instance running and accessible (see [main README](../../../README.md) for setup)
- `ai` >= 4.0.0 installed in your project
