import { afterEach, describe, expect, it } from "vitest";
import {
  SILVA_MAIN_MODEL_ID,
  SILVA_MAIN_PROVIDER,
  SILVA_SUBAGENT_MODEL_ID,
  SILVA_SUBAGENT_PROVIDER,
} from "../config/silva-providers.js";
import { buildLogEntry, estimateCost, resolveRoute } from "./model-router.js";

describe("resolveRoute", () => {
  afterEach(() => {
    delete process.env.SILVA_ROUTER_RULES;
  });

  it("routes main role to gemini-flash by default", () => {
    const decision = resolveRoute("main");
    expect(decision.provider).toBe(SILVA_MAIN_PROVIDER);
    expect(decision.model).toBe(SILVA_MAIN_MODEL_ID);
    expect(decision.reason).toBe("default-role:main");
  });

  it("routes subagent role to claude-sonnet by default", () => {
    const decision = resolveRoute("subagent");
    expect(decision.provider).toBe(SILVA_SUBAGENT_PROVIDER);
    expect(decision.model).toBe(SILVA_SUBAGENT_MODEL_ID);
    expect(decision.reason).toBe("default-role:subagent");
  });

  it("applies env var override for main role", () => {
    process.env.SILVA_ROUTER_RULES = JSON.stringify({
      overrides: {
        main: { provider: "anthropic-messages", model: "claude-haiku-4-5" },
      },
    });
    const decision = resolveRoute("main");
    expect(decision.provider).toBe("anthropic-messages");
    expect(decision.model).toBe("claude-haiku-4-5");
    expect(decision.reason).toBe("config-override:main");
  });

  it("applies env var override for subagent role", () => {
    process.env.SILVA_ROUTER_RULES = JSON.stringify({
      overrides: {
        subagent: { provider: "google-generative-ai", model: "gemini-2.0-flash" },
      },
    });
    const decision = resolveRoute("subagent");
    expect(decision.provider).toBe("google-generative-ai");
    expect(decision.model).toBe("gemini-2.0-flash");
    expect(decision.reason).toBe("config-override:subagent");
  });

  it("ignores malformed SILVA_ROUTER_RULES and falls back to defaults", () => {
    process.env.SILVA_ROUTER_RULES = "not-valid-json";
    const decision = resolveRoute("main");
    expect(decision.model).toBe(SILVA_MAIN_MODEL_ID);
  });

  it("preserves role in decision", () => {
    expect(resolveRoute("main").role).toBe("main");
    expect(resolveRoute("subagent").role).toBe("subagent");
  });
});

describe("estimateCost", () => {
  it("calculates cost for gemini-flash", () => {
    const cost = estimateCost({
      model: SILVA_MAIN_MODEL_ID,
      promptTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    // $0.10 input + $0.40 output = $0.50
    expect(cost).toBeCloseTo(0.5);
  });

  it("calculates cost for claude-sonnet", () => {
    const cost = estimateCost({
      model: SILVA_SUBAGENT_MODEL_ID,
      promptTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    // $3.00 input + $15.00 output = $18.00
    expect(cost).toBeCloseTo(18.0);
  });

  it("returns 0 for unknown model", () => {
    const cost = estimateCost({ model: "unknown-model", promptTokens: 1000, outputTokens: 500 });
    expect(cost).toBe(0);
  });

  it("handles fractional token counts correctly", () => {
    const cost = estimateCost({
      model: SILVA_MAIN_MODEL_ID,
      promptTokens: 500_000,
      outputTokens: 0,
    });
    expect(cost).toBeCloseTo(0.05);
  });
});

describe("buildLogEntry", () => {
  it("builds a log entry with cost estimate when tokens are provided", () => {
    const decision = resolveRoute("main");
    const entry = buildLogEntry({
      decision,
      latencyMs: 1234,
      promptTokens: 1_000,
      outputTokens: 500,
    });
    expect(entry.model_used).toBe(SILVA_MAIN_MODEL_ID);
    expect(entry.role).toBe("main");
    expect(entry.latency_ms).toBe(1234);
    expect(entry.prompt_tokens).toBe(1_000);
    expect(entry.output_tokens).toBe(500);
    expect(entry.cost_estimate_usd).toBeTypeOf("number");
    expect(entry.cost_estimate_usd).toBeGreaterThan(0);
  });

  it("omits cost_estimate_usd when tokens are not provided", () => {
    const decision = resolveRoute("subagent");
    const entry = buildLogEntry({ decision });
    expect(entry.cost_estimate_usd).toBeUndefined();
    expect(entry.latency_ms).toBeUndefined();
  });

  it("includes the routing reason in the log entry", () => {
    const decision = resolveRoute("main");
    const entry = buildLogEntry({ decision });
    expect(entry.reason).toBe("default-role:main");
  });
});
