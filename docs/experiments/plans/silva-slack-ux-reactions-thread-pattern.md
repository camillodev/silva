---
summary: "POC: Slack UX reaction state machine with thread-only replies for Silva"
read_when:
  - Planning Slack UX behavior for Silva in channels
  - Implementing thread-first behavior and reaction states in Slack
owner: "silva"
status: "draft"
last_updated: "2026-03-07"
title: "Silva Slack UX Reactions and Thread Pattern POC"
---

# Silva Slack UX Reactions and Thread Pattern POC

## Objective

Make Silva feel responsive in Slack without polluting the main channel:

- main channel shows only reaction feedback on the original message
- all text responses are posted in the message thread

Golden rule:

- Silva never posts in the main channel for inbound user messages
- Silva always replies in the thread anchored at the original message `ts`

## Core interaction pattern

Flow:

1. User posts a message in channel
2. Silva immediately adds `⏳` on that original message (`hourglass_flowing_sand`)
3. If work is expected to take longer than 3 seconds, swap `⏳` to `👀` (`eyes`)
4. Silva posts the actual answer in the thread (`thread_ts = original ts`)
5. Silva clears its own temporary reactions silently (no extra channel noise)
6. User can validate with `✅` or cancel with `❌` from thread context

## Reaction state model

| Emoji | Shortcode                | Owner | Meaning         | Trigger                                                   |
| ----- | ------------------------ | ----- | --------------- | --------------------------------------------------------- |
| ⏳    | `hourglass_flowing_sand` | Silva | Processing      | Immediately on inbound message                            |
| 👀    | `eyes`                   | Silva | Working/tooling | When processing passes threshold or enters tool phase     |
| ✅    | `white_check_mark`       | User  | Validated       | User confirms in thread (`ok`, `perfeito`, `valeu`, etc.) |
| ❌    | `x`                      | User  | Cancelled       | User cancels in thread (`cancela`, `para`, `stop`, etc.)  |

Rules:

- Silva must never keep multiple status reactions at once
- Silva must never add `✅` automatically in the normal completion path
- Silva clears `⏳`/`👀` after reply completion or failure handling

## Thread-only reply contract

All outbound Slack replies for this flow must use:

- `chat.postMessage`
- `thread_ts` equal to the original inbound message timestamp

No main-channel text reply should be emitted for handled inbound turns.

## Intent detection in thread replies

Approval intent examples:

- `ok`, `okay`, `perfeito`, `otimo`, `valeu`, `obrigado`, `show`, `sim`, `yes`, `👍`

Cancel intent examples:

- `cancela`, `cancelar`, `para`, `parar`, `esquece`, `nao precisa`
- `stop`, `cancel`, `nevermind`, `forget it`

Behavior:

- approval intent in thread -> set `✅` on the parent message
- cancel intent in thread -> set `❌` on the parent message and reply in thread with cancellation confirmation

## UX guardrails

- add initial `⏳` in less than 500ms
- only swap `⏳ -> 👀` when work is not quick (threshold-based)
- never leave status reaction stuck permanently
- avoid reaction flicker for short tasks
- keep main channel visually clean

## Current implementation snapshot (as of 2026-03-07)

What already exists in code:

- `src/slack/silva-reactions.ts`
  - contains `SlackReactionManager` with `⏳` immediate behavior and automatic `⏳ -> 👀` threshold swap
  - enforces single-reaction semantics by clearing own reactions first
- `src/slack/silva-thread-reply.ts`
  - contains `replyInThread(...)` helper with `thread_ts`
  - contains `isApprovalIntent(...)` and `isCancelIntent(...)` helpers

Main gap:

- these Silva POC helpers are not wired into the active Slack monitor/dispatch pipeline yet
- runtime behavior still primarily follows current `ackReaction` and `typingReaction` flow

## POC completion estimate

Estimated completion: **35%**

Breakdown:

- utilities and primitives implemented: **70%** (helpers exist)
- integrated end-to-end handler behavior: **10%** (not wired into main inbound flow)
- docs and explicit UX spec in project docs: **100%** (this page)

Weighted overall = **35%**.

## Integration checklist to reach 100%

- wire `SlackReactionManager` into inbound Slack message handling path
- enforce thread-only reply path for this Silva flow
- run approval/cancel detection on user thread replies and set parent reaction
- ensure cleanup on success, error, and cancellation paths
- add tests for:
  - immediate `⏳` ack
  - delayed `⏳ -> 👀` swap
  - thread-only outbound replies
  - user approval/cancel reaction transitions

## Integration hub strategy for this POC

To match Viktor-style scalability without app-by-app hardcoding, this POC must follow a single integration hub contract:

- one generic integration tool surface (discover + execute), not one custom path per app
- dynamic discovery first (`list_apps` -> `list_actions`) before any execution
- execute actions by action id (`execute` + params), not by app-specific branching in handler code
- read/list operations can run directly; write/side-effect operations require explicit approval step
- per-run logging must capture app, action id, params summary, and result status for traceability

### POC acceptance criteria (integrations)

- no Slack handler switch/case by external app name
- successful discovery flow validated in runtime (`list_apps`, `list_actions`)
- at least one read action and one write action executed through the same generic path
- write action path is gated by explicit user approval

## Viktor reference snapshot (public evidence)

This POC is based on publicly observable Viktor behavior and official public pages.

Confirmed externally:

- Viktor is Slack-native and supports channel mentions, DM, and thread continuation
- once in a thread, users continue without re-mentioning
- high-impact actions use explicit approval UX (approve/reject)
- long-running and scheduled work is part of the product behavior

Source of truth for team memory:

- `docs/memory-project.md`
