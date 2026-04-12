# @azen-sh/mcp

An [MCP](https://modelcontextprotocol.io) (Model Context Protocol) server that lets AI tools like Claude Desktop, Cursor, or any MCP-compatible client talk to your Azen memory API over stdio.

## Setup

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "azen": {
      "command": "/path/to/bun",
      "args": ["run", "/path/to/azen-sh/packages/mcp/index.ts"],
      "env": {
        "AZEN_URL": "http://localhost:3000"
      }
    }
  }
}
```

Replace `/path/to/bun` with the output of `which bun`, and update the path to your Azen repo. Restart your AI tool after saving.

## Tools exposed

| Tool | Description |
|---|---|
| `add_memory` | Store a new memory |
| `search_memories` | Semantically search stored memories |
| `list_memories` | List all memories for a user |
| `delete_memory` | Delete a memory by ID |

## Requirements

Your Azen API must be running and accessible at the URL specified in `AZEN_URL` (defaults to `http://localhost:3000`).
