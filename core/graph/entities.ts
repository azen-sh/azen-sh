import { llmProvider } from "../llm"

export type EntityType =
  | "person"
  | "place"
  | "topic"
  | "preference"
  | "activity"
  | "organization"
  | "event"
  | "other"

export type ExtractedEntity = {
  name: string
  type: EntityType
  relation: string
}

const VALID_TYPES: ReadonlySet<EntityType> = new Set<EntityType>([
  "person",
  "place",
  "topic",
  "preference",
  "activity",
  "organization",
  "event",
  "other",
])

const SYSTEM_PROMPT = `You extract entities from short pieces of text (personal memories, notes, preferences).

Return JSON in exactly this shape:
{"entities": [{"name": string, "type": string, "relation": string}]}

Rules:
- Extract between 1 and 5 of the most salient entities.
- "name" is a short normalized label for the entity (lowercase, singular where possible).
- "type" must be exactly one of: person, place, topic, preference, activity, organization, event, other.
- "relation" is a short verb phrase describing how the subject of the text relates to the entity (e.g. "likes", "lives_in", "works_at", "allergic_to", "attended", "knows_about").
- Prefer general topics over overly specific phrases (e.g. "italian food" not "the italian place on 5th").
- If nothing useful can be extracted, return {"entities": []}.
- Output JSON only, no prose, no markdown fences.`

export async function extractEntities(content: string): Promise<ExtractedEntity[]> {
  if (!content.trim()) return []

  let raw: string
  try {
    raw = await llmProvider.complete(content, SYSTEM_PROMPT)
  } catch (err) {
    console.error("[entities] LLM call failed:", err)
    return []
  }

  const parsed = safeParseJSON(raw)
  if (!parsed || typeof parsed !== "object") return []

  const entitiesRaw = (parsed as { entities?: unknown }).entities
  if (!Array.isArray(entitiesRaw)) return []

  const results: ExtractedEntity[] = []
  for (const item of entitiesRaw) {
    if (!item || typeof item !== "object") continue
    const { name, type, relation } = item as Record<string, unknown>
    if (typeof name !== "string" || typeof type !== "string" || typeof relation !== "string") continue

    const normalizedName = name.trim().toLowerCase()
    const normalizedType = type.trim().toLowerCase() as EntityType
    const normalizedRelation = relation.trim().toLowerCase().replace(/\s+/g, "_")

    if (!normalizedName || !normalizedRelation) continue
    if (!VALID_TYPES.has(normalizedType)) continue

    results.push({
      name: normalizedName,
      type: normalizedType,
      relation: normalizedRelation,
    })

    if (results.length >= 5) break
  }

  return results
}

function safeParseJSON(raw: string): unknown {
  const trimmed = raw.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    // fall through — try to recover from fenced / prose wrapping
  }

  const match = trimmed.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}
