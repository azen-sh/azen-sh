import { useState, useCallback } from "react"
import { api } from "@/lib/api"
import type { Memory } from "@/lib/api"
import { Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

export function MemoriesPage() {
  const [userId, setUserId] = useState("")
  const [appId, setAppId] = useState("")
  const [memories, setMemories] = useState<Memory[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Memory | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const fetchMemories = useCallback(
    async (newOffset = 0) => {
      if (!userId.trim()) {
        setError("userId is required")
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await api.memories.list({
          userId: userId.trim(),
          appId: appId.trim() || undefined,
          limit: PAGE_SIZE,
          offset: newOffset,
        })
        setMemories(res)
        setHasMore(res.length === PAGE_SIZE)
        setOffset(newOffset)
        setHasSearched(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch memories")
      } finally {
        setLoading(false)
      }
    },
    [userId, appId]
  )

  const handleDelete = async (id: string) => {
    try {
      await api.memories.delete(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    }
  }

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold">Memories</h1>

        {/* Filters */}
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            placeholder="userId (required)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchMemories(0)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="appId (optional)"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchMemories(0)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={() => fetchMemories(0)}
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        {/* Table */}
        {hasSearched && (
          <div className="mt-4">
            {memories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No memories found.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Content</th>
                      <th className="pb-2 pr-4 font-medium w-32">App ID</th>
                      <th className="pb-2 pr-4 font-medium w-40">Created</th>
                      <th className="pb-2 font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {memories.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setSelected(m)}
                        className={cn(
                          "cursor-pointer border-b border-border/50 transition-colors hover:bg-accent/30",
                          selected?.id === m.id && "bg-accent/50"
                        )}
                      >
                        <td className="max-w-md truncate py-3 pr-4">
                          {m.content}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {m.appId}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(m.id)
                            }}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {(offset > 0 || hasMore) && (
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Page {currentPage}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchMemories(offset - PAGE_SIZE)}
                        disabled={offset === 0}
                        className="rounded-md border border-border p-1.5 hover:bg-accent disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => fetchMemories(offset + PAGE_SIZE)}
                        disabled={!hasMore}
                        className="rounded-md border border-border p-1.5 hover:bg-accent disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 shrink-0 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Memory Detail</h2>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">ID</span>
              <p className="mt-0.5 break-all font-mono text-xs">{selected.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">User ID</span>
              <p className="mt-0.5">{selected.userId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">App ID</span>
              <p className="mt-0.5">{selected.appId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Content</span>
              <p className="mt-0.5 whitespace-pre-wrap">{selected.content}</p>
            </div>
            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <div>
                <span className="text-muted-foreground">Metadata</span>
                <pre className="mt-0.5 overflow-auto rounded bg-background p-2 text-xs">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="mt-0.5">
                {new Date(selected.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Updated</span>
              <p className="mt-0.5">
                {new Date(selected.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
