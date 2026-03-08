/**
 * Silva default provider + model configuration.
 *
 * Role assignment (decided in F1):
 *   main     → Gemini 2.0 Flash   (agent conversation loop — speed + cost)
 *   subagent → Claude Sonnet 4.6  (delegated tasks — quality where it matters)
 *
 * Costs in USD per 1M tokens (used for llm_logs cost estimation).
 */

export const SILVA_MAIN_MODEL_ID = "gemini-2.0-flash";
export const SILVA_SUBAGENT_MODEL_ID = "claude-sonnet-4-6";

export const SILVA_MAIN_PROVIDER = "google-generative-ai";
export const SILVA_SUBAGENT_PROVIDER = "anthropic-messages";

export type SilvaModelRole = "main" | "subagent";

export const SILVA_MODEL_BY_ROLE: Record<SilvaModelRole, { provider: string; model: string }> = {
  main: { provider: SILVA_MAIN_PROVIDER, model: SILVA_MAIN_MODEL_ID },
  subagent: { provider: SILVA_SUBAGENT_PROVIDER, model: SILVA_SUBAGENT_MODEL_ID },
};

/** Cost per 1M tokens in USD. */
export const SILVA_MODEL_COSTS: Record<string, { input: number; output: number }> = {
  [SILVA_MAIN_MODEL_ID]: { input: 0.1, output: 0.4 }, // Gemini 2.0 Flash
  [SILVA_SUBAGENT_MODEL_ID]: { input: 3.0, output: 15.0 }, // Claude Sonnet 4.6
};
