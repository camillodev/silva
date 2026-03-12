/**
 * Inbound payload normalizer: Pipedream → Silva agent message string.
 * Called by the hooks system as a messageTemplate alternative.
 */

export type PipedreamPayload = {
  event?: string;
  source?: string;
  summary?: string;
  data?: Record<string, unknown>;
  channel?: string;
  user?: string;
  [key: string]: unknown;
};

/** TypeScript type alias for docs/tooling — mirrors PipedreamPayload. */
export type PIPEDREAM_EVENT_SCHEMA = PipedreamPayload;

export const PIPEDREAM_HOOK_PATH = "/hooks/pipedream";
export const PIPEDREAM_HOOK_ID = "pipedream-default";

const MAX_DATA_KEYS = 3;
const MAX_VALUE_LEN = 100;

/**
 * Truncate a string to at most `max` characters, appending "…" when cut.
 */
function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

/**
 * Render a data value to a compact string for inline context.
 * Objects/arrays are JSON-stringified; primitives are coerced.
 */
function renderValue(v: unknown): string {
  if (v === null) {
    return "null";
  }
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return "[object]";
    }
  }
  return typeof v === "string" ? v : JSON.stringify(v);
}

/**
 * Build a brief "Data: key1=val1, key2=val2" context string from the
 * top-level keys of `data` (max 3 keys; values truncated to 100 chars).
 */
function buildDataContext(data: Record<string, unknown>): string {
  const entries = Object.entries(data).slice(0, MAX_DATA_KEYS);
  if (entries.length === 0) {
    return "";
  }
  const parts = entries.map(([k, v]) => `${k}=${truncate(renderValue(v), MAX_VALUE_LEN)}`);
  return `Data: ${parts.join(", ")}`;
}

/**
 * Normalize a raw Pipedream webhook payload into a human-readable message
 * for the Silva agent.
 */
export function normalizePipedreamPayload(raw: unknown): string {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return "[Pipedream] New event received";
  }

  const payload = raw as PipedreamPayload;

  // Build the primary line: "[Pipedream] {event}: {summary}" or fallback
  let headline: string;
  if (payload.event) {
    headline = payload.summary
      ? `[Pipedream] ${payload.event}: ${payload.summary}`
      : `[Pipedream] ${payload.event}`;
  } else if (payload.source) {
    headline = `[Pipedream event from ${payload.source}]`;
  } else {
    headline = "[Pipedream] New event received";
  }

  // Append brief data context when present
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    const context = buildDataContext(payload.data);
    if (context) {
      return `${headline}\n${context}`;
    }
  }

  return headline;
}
