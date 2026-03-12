---
summary: "Project memory: Viktor behavior, parity targets, and non-negotiable UX rules for Silva"
read_when:
  - planning Silva UX parity work
  - implementing Slack reactions, threads, approvals, and long-running tasks
owner: "silva"
status: "active"
last_updated: "2026-03-07"
title: "Silva Project Memory (Viktor Parity)"
---

# Silva Project Memory (Viktor Parity)

## Why this file exists

Root problem:

- critical Viktor parity knowledge was spread across chat, issues, and links
- AI handoffs were losing context and repeating discovery

This file is the canonical memory for Viktor parity decisions and facts.

## What we know about Viktor (public evidence only)

### Confirmed behavior

- Viktor is Slack-native in channels, threads, and DMs.
- Users can mention Viktor in channels and continue in thread context.
- Viktor supports explicit approval flow for important actions.
- Viktor handles long-running background work and scheduled tasks.
- Viktor integrates with many external tools and executes actions.

### Evidence sources

- Docs: `https://getviktor.com/docs`
- Slack landing: `https://app.getviktor.com/slack`
- Site: `https://getviktor.com/`
- Slack marketplace: `https://slack.com/marketplace/A0A2VN5TR5K-viktor`
- Architecture blog: `https://getviktor.com/blog/what-breaks-when-your-agent-has-100000-tools`
- Internal visual reference screenshot (Slack UX): workspace asset captured on 2026-03-07

### Important limitation

- Viktor is closed-source for us.
- We can validate external UX behavior and official claims.
- We cannot claim exact internal implementation details.

## Silva parity goals we want to apply

### Slack UX non-negotiables

- main channel stays clean (status signal only)
- replies for inbound messages happen in thread
- status reactions represent progress lifecycle
- no stuck reactions and no multiple Silva status reactions at once

### Approval and cancellation model

- user approval in thread maps to done state
- user cancellation maps to cancelled state and explicit thread confirmation
- high-impact actions should keep explicit approve/reject gating

### Reliability expectations

- immediate visual ack on inbound
- deterministic cleanup on success, error, and cancel paths
- tests cover core flow and failure paths

### Integration strategy non-negotiable

- integrations in POC must use a hub pattern (discover + execute), not app-specific hardcoded branches
- discovery order is mandatory: list apps, list actions, then execute by action id
- any write/side-effect action must pass explicit approval before execution
- logs must include action id + integration outcome to keep runs auditable

## Current POC status snapshot

- POC plan doc exists: `docs/experiments/plans/silva-slack-ux-reactions-thread-pattern.md`
- milestone and mandatory subtasks were created in Linear (ENG-135 and children)
- reactions helpers exist in code but are not fully wired to the active Slack pipeline

## Mandatory delivery rule (DoD gate)

- A task can only be marked Done after 100% of its Definition of Done checklist is checked.
- Parent task can only be Done when all child tasks are Done and parent DoD is 100% complete.

## Implementation references in this repo

- `src/slack/silva-reactions.ts`
- `src/slack/silva-thread-reply.ts`
- `src/slack/monitor/message-handler.ts`
- `src/slack/monitor/message-handler/prepare.ts`
- `src/slack/monitor/message-handler/dispatch.ts`

## Working assumptions

- We optimize for observed UX parity, not clone-level architecture parity.
- We keep behavior explicit, testable, and reversible.
- We avoid broad refactors while closing POC tasks (surgical edits only).

## Strategic architecture notes (from 2026-03-07 analysis)

These notes were extracted from the internal "AI Agent as Micro SaaS" analysis and should guide scope decisions:

- autonomy is system-level (memory + heartbeat + gated crons + approvals + integrations), not a single feature
- OpenClaw remains the best base runtime for Silva because it already has skills, messaging, and proactivity primitives
- CrewAI/LangGraph are optional complements for specific complex workflows, not mandatory for core parity
- use condition-gated cron patterns to control token/cost burn before scaling autonomous routines
- keep Markdown skill memory as default; only introduce vector retrieval when corpus scale/recall quality requires it
- productization gaps (outside core parity): multi-tenancy, billing/metering, stronger approval middleware, and admin dashboard

Canonical detailed research doc:

- `docs/experiments/research/ai-agent-microsaas.md`
