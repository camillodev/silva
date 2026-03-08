/**
 * Draft Approval Store — ENG-116
 *
 * In-memory state machine for pending agent actions that require
 * user approval via Slack Block Kit buttons before execution.
 *
 * Flow:
 *   1. Agent calls draft_approval(action="create", description="...", channelId="C...", threadTs="...")
 *   2. Block Kit message sent with [✅ Aprovar] and [❌ Rejeitar] buttons
 *   3. User clicks button → Slack fires openclaw:draft:approve:{id} or openclaw:draft:reject:{id}
 *   4. Existing interactions.ts handler acks + enqueues system event to agent
 *   5. Agent receives event, checks draft status, executes or cancels
 *
 * Action ID format (must start with "openclaw:" to be caught by existing handler):
 *   openclaw:draft:approve:{draftId}
 *   openclaw:draft:reject:{draftId}
 */

import { randomUUID } from "node:crypto";

const DRAFT_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const DRAFT_APPROVE_PREFIX = "openclaw:draft:approve:";
export const DRAFT_REJECT_PREFIX = "openclaw:draft:reject:";

export type DraftStatus = "pending" | "approved" | "rejected" | "expired";

export type DraftEntry = {
  id: string;
  /** Human-readable description shown in Block Kit card. */
  description: string;
  channelId: string;
  threadTs?: string;
  /** Populated after the Block Kit message is sent. */
  messageTs?: string;
  createdAt: number;
  ttlMs: number;
};

const store = new Map<string, DraftEntry>();

/** Remove entries past their TTL. Called before every create to avoid unbounded growth. */
function evictExpired(): void {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (now - entry.createdAt > entry.ttlMs) {
      store.delete(id);
    }
  }
}

/** Create a new draft. Returns the entry with a generated short ID. */
export function createDraft(params: Omit<DraftEntry, "id" | "createdAt" | "ttlMs">): DraftEntry {
  evictExpired();
  // 8-char hex short ID: readable in action_id, very low collision risk for this use case.
  const id = randomUUID().replace(/-/g, "").slice(0, 8);
  const entry: DraftEntry = {
    ...params,
    id,
    createdAt: Date.now(),
    ttlMs: DRAFT_TTL_MS,
  };
  store.set(id, entry);
  return entry;
}

/** Retrieve a draft by ID. Returns undefined if not found or expired. */
export function getDraft(id: string): DraftEntry | undefined {
  const entry = store.get(id);
  if (!entry) {
    return undefined;
  }
  if (Date.now() - entry.createdAt > entry.ttlMs) {
    store.delete(id);
    return undefined;
  }
  return entry;
}

/** Store the Block Kit message ts so it can be referenced later. */
export function patchDraftMessageTs(id: string, messageTs: string): void {
  const entry = store.get(id);
  if (entry) {
    entry.messageTs = messageTs;
  }
}

/** Remove a draft (on cancel or after execution). */
export function deleteDraft(id: string): void {
  store.delete(id);
}

/** Parse a draft ID from an approve/reject action_id. Returns undefined if not a draft action. */
export function parseDraftActionId(
  actionId: string,
): { id: string; approved: boolean } | undefined {
  if (actionId.startsWith(DRAFT_APPROVE_PREFIX)) {
    return { id: actionId.slice(DRAFT_APPROVE_PREFIX.length), approved: true };
  }
  if (actionId.startsWith(DRAFT_REJECT_PREFIX)) {
    return { id: actionId.slice(DRAFT_REJECT_PREFIX.length), approved: false };
  }
  return undefined;
}
