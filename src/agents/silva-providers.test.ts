import { describe, expect, it } from "vitest";
import {
  SILVA_MAIN_MODEL_ID,
  SILVA_MAIN_PROVIDER,
  SILVA_MODEL_BY_ROLE,
  SILVA_MODEL_COSTS,
  SILVA_SUBAGENT_MODEL_ID,
  SILVA_SUBAGENT_PROVIDER,
} from "../config/silva-providers.js";

describe("Silva provider constants", () => {
  it("main model is gemini-2.0-flash via google-generative-ai", () => {
    expect(SILVA_MAIN_MODEL_ID).toBe("gemini-2.0-flash");
    expect(SILVA_MAIN_PROVIDER).toBe("google-generative-ai");
  });

  it("subagent model is claude-sonnet-4-6 via anthropic-messages", () => {
    expect(SILVA_SUBAGENT_MODEL_ID).toBe("claude-sonnet-4-6");
    expect(SILVA_SUBAGENT_PROVIDER).toBe("anthropic-messages");
  });

  it("SILVA_MODEL_BY_ROLE maps both roles", () => {
    expect(SILVA_MODEL_BY_ROLE.main.model).toBe(SILVA_MAIN_MODEL_ID);
    expect(SILVA_MODEL_BY_ROLE.main.provider).toBe(SILVA_MAIN_PROVIDER);
    expect(SILVA_MODEL_BY_ROLE.subagent.model).toBe(SILVA_SUBAGENT_MODEL_ID);
    expect(SILVA_MODEL_BY_ROLE.subagent.provider).toBe(SILVA_SUBAGENT_PROVIDER);
  });

  it("costs are defined for both models", () => {
    expect(SILVA_MODEL_COSTS[SILVA_MAIN_MODEL_ID]).toBeDefined();
    expect(SILVA_MODEL_COSTS[SILVA_SUBAGENT_MODEL_ID]).toBeDefined();
  });

  it("main model is cheaper than subagent model (cost sanity check)", () => {
    const mainCost = SILVA_MODEL_COSTS[SILVA_MAIN_MODEL_ID];
    const subagentCost = SILVA_MODEL_COSTS[SILVA_SUBAGENT_MODEL_ID];
    expect(mainCost.input).toBeLessThan(subagentCost.input);
    expect(mainCost.output).toBeLessThan(subagentCost.output);
  });
});
