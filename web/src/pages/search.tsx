import { useState } from "react"
import { api } from "@/lib/api"
import type { SearchResult } from "@/lib/api"
import { Loader2, Search } from "lucide-react"

export function SearchPage() {
  const [query, setQuery] = useState("")
  const [userId, setUserId] = useState("")
  const [appId, setAppId] = useState("")
  const [topK, setTopK] = useState(10)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim() || !userId.trim()) {
      setError("query and userId are required")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.search({
        query: query.trim(),
        userId: userId.trim(),
        appId: appId.trim() || undefined,
        topK,
      })
      setResults(res)
      setHasSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Semantic Search</h1>

      {/* Search form */}
      <div className="mt-4 space-y-3">
        <textarea
          placeholder="Enter your search query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSearch()
            }
          }}
          rows={3}
          className="w-full max-w-2xl rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="userId (required)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="appId (optional)"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            title="Top K results"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {/* Results */}
      {hasSearched && (
        <div className="mt-6 max-w-3xl">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No results found.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 && "s"}
              </p>
              {results.map((r) => (
                <div
                  key={r.memory.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="flex-1 text-sm whitespace-pre-wrap">
                      {r.memory.content}
                    </p>
                    <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                      {(r.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>User: {r.memory.userId}</span>
                    <span>App: {r.memory.appId}</span>
                    <span>
                      {new Date(r.memory.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
