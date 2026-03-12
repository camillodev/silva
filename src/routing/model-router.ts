/**
 * Silva Model Router v0 — role-based model selection.
 *
 * Routing policy (F1):
 *   main     → gemini-2.0-flash   (agent conversation loop)
 *   subagent → claude-sonnet-4-6  (delegated complex tasks)
 *
 * Fallback: if the resolved model is "main" and the call fails, the caller
 * should retry with role="subagent" and log the fallback reason.
 */

import {
  SILVA_MODEL_BY_ROLE,
  SILVA_MODEL_COSTS,
  type SilvaModelRole,
} from "../config/silva-providers.js";
import { loadRouterConfig } from "./router-config.js";

export type RouteDecision = {
  role: SilvaModelRole;
  provider: string;
  model: string;
  reason: string;
};

export type LlmLogEntry = {
  model_used: string;
  role: SilvaModelRole;
  reason: string;
  latency_ms?: number;
  cost_estimate_usd?: number;
  prompt_tokens?: number;
  output_tokens?: number;
};

/**
 * Resolve which provider/model to use for a given role.
 * Config overrides (router.yaml / SILVA_ROUTER_RULES) take precedence.
 */
export function resolveRoute(role: SilvaModelRole): RouteDecision {
  const config = loadRouterConfig();
  const override = config.overrides?.[role];
  if (override) {
    return { role, ...override, reason: `config-override:${role}` };
  }
  const defaults = SILVA_MODEL_BY_ROLE[role];
  return { role, ...defaults, reason: `default-role:${role}` };
}

/** Estimate USD cost for a completed LLM call. Returns 0 if model is unknown. */
export function estimateCost(params: {
  model: string;
  promptTokens: number;
  outputTokens: number;
}): number {
  const costs = SILVA_MODEL_COSTS[params.model];
  if (!costs) {
    return 0;
  }
  return (
    (params.promptTokens / 1_000_000) * costs.input +
    (params.outputTokens / 1_000_000) * costs.output
  );
}

/** Build a structured log entry to be persisted in llm_logs. */
export function buildLogEntry(params: {
  decision: RouteDecision;
  latencyMs?: number;
  promptTokens?: number;
  outputTokens?: number;
}): LlmLogEntry {
  const costEstimate =
    params.promptTokens !== undefined && params.outputTokens !== undefined
      ? estimateCost({
          model: params.decision.model,
          promptTokens: params.promptTokens,
          outputTokens: params.outputTokens,
        })
      : undefined;

  return {
    model_used: params.decision.model,
    role: params.decision.role,
    reason: params.decision.reason,
    latency_ms: params.latencyMs,
    cost_estimate_usd: costEstimate,
    prompt_tokens: params.promptTokens,
    output_tokens: params.outputTokens,
  };
}
