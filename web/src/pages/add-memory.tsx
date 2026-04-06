import { useState } from "react"
import { api } from "@/lib/api"
import { Loader2, Check } from "lucide-react"

export function AddMemoryPage() {
  const [userId, setUserId] = useState("")
  const [appId, setAppId] = useState("")
  const [content, setContent] = useState("")
  const [metadata, setMetadata] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId.trim() || !content.trim()) {
      setError("userId and content are required")
      return
    }

    let parsedMetadata: Record<string, unknown> | undefined
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata.trim())
      } catch {
        setError("Metadata must be valid JSON")
        return
      }
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await api.memories.create({
        userId: userId.trim(),
        appId: appId.trim() || undefined,
        content: content.trim(),
        metadata: parsedMetadata,
      })
      setSuccess(true)
      setContent("")
      setMetadata("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create memory")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Add Memory</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            User ID *
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g. user_123"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            App ID
          </label>
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="default"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Memory content..."
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Metadata (JSON)
          </label>
          <textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder='{"key": "value"}'
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="h-4 w-4" />
            Memory created successfully
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Memory
        </button>
      </form>
    </div>
  )
}
