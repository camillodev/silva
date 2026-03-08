/**
 * Silva model router configuration loader.
 *
 * Load order (highest to lowest priority):
 *   1. Env var SILVA_ROUTER_RULES (JSON)
 *   2. File ~/.silva/router.yaml
 *
 * router.yaml format:
 *   main: google-generative-ai/gemini-2.0-flash
 *   subagent: anthropic-messages/claude-sonnet-4-6
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SilvaModelRole } from "../config/silva-providers.js";

type ModelOverride = { provider: string; model: string };

export type RouterConfig = {
  overrides?: Partial<Record<SilvaModelRole, ModelOverride>>;
};

function parseRouterYaml(content: string): RouterConfig {
  const overrides: Partial<Record<SilvaModelRole, ModelOverride>> = {};
  for (const line of content.split("\n")) {
    // Match "role: provider/model" lines
    const m = /^(\w+):\s*(\S+\/\S+)/.exec(line.trim());
    if (!m) {
      continue;
    }
    const key = m[1];
    const value = m[2];
    const slashIdx = value.indexOf("/");
    const provider = value.slice(0, slashIdx);
    const model = value.slice(slashIdx + 1);
    if ((key === "main" || key === "subagent") && provider && model) {
      overrides[key as SilvaModelRole] = { provider, model };
    }
  }
  return { overrides };
}

export function loadRouterConfig(): RouterConfig {
  // Env var takes highest priority (JSON format).
  const envRules = process.env.SILVA_ROUTER_RULES;
  if (envRules) {
    try {
      return JSON.parse(envRules) as RouterConfig;
    } catch {
      // fall through to file
    }
  }

  const configPath = path.join(os.homedir(), ".silva", "router.yaml");
  try {
    const content = fs.readFileSync(configPath, "utf-8");
    return parseRouterYaml(content);
  } catch {
    return {};
  }
}
