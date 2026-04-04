const BASE_URL = "/api"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { error?: string }).error ?? `Request failed: ${res.status}`
    )
  }
  return res.json() as Promise<T>
}

export interface Memory {
  id: string
  userId: string
  appId: string
  content: string
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  expiresAt: string | null
}

export interface MemoryListResponse {
  memories: Memory[]
  total: number
}

export interface SearchResult {
  memory: Memory
  score: number
}

export const api = {
  memories: {
    list(params: {
      userId: string
      appId?: string
      limit?: number
      offset?: number
    }) {
      const qs = new URLSearchParams({ userId: params.userId })
      if (params.appId) qs.set("appId", params.appId)
      if (params.limit) qs.set("limit", String(params.limit))
      if (params.offset !== undefined) qs.set("offset", String(params.offset))
      return request<MemoryListResponse>(`/memories?${qs.toString()}`)
    },

    get(id: string) {
      return request<Memory>(`/memories/${id}`)
    },

    create(data: {
      userId: string
      appId?: string
      content: string
      metadata?: Record<string, unknown>
    }) {
      return request<Memory>("/memories", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },

    update(
      id: string,
      data: { content?: string; metadata?: Record<string, unknown> }
    ) {
      return request<Memory>(`/memories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    },

    delete(id: string) {
      return request<{ success: boolean }>(`/memories/${id}`, {
        method: "DELETE",
      })
    },

    deleteAll(userId: string, appId?: string) {
      const qs = new URLSearchParams({ userId })
      if (appId) qs.set("appId", appId)
      return request<{ success: boolean }>(`/memories?${qs.toString()}`, {
        method: "DELETE",
      })
    },
  },

  search(params: {
    query: string
    userId: string
    appId?: string
    topK?: number
  }) {
    return request<SearchResult[]>("/search", {
      method: "POST",
      body: JSON.stringify(params),
    })
  },
}
