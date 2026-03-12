/**
 * Tenant configuration loader.
 *
 * Load order (highest to lowest priority):
 *   1. Env vars: SILVA_TENANT_NAME, SILVA_TENANT_DESCRIPTION,
 *      SILVA_TENANT_TEAM_INFO, SILVA_TENANT_LANG
 *   2. File: ~/.silva/tenant.yaml
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type TenantConfig = {
  name?: string;
  description?: string;
  teamInfo?: string;
  /** BCP-47 language tag, e.g. "pt-BR" or "en". */
  language?: string;
};

// Minimal YAML parsing: handles flat "key: value" lines only.
function parseSimpleYaml(content: string): TenantConfig {
  const cfg: TenantConfig = {};
  for (const line of content.split("\n")) {
    const m = /^(\w+):\s*(.+)/.exec(line.trim());
    if (!m) {
      continue;
    }
    const key = m[1];
    const val = m[2].trim();
    if (key === "name") {
      cfg.name = val;
    } else if (key === "description") {
      cfg.description = val;
    } else if (key === "team_info") {
      cfg.teamInfo = val;
    } else if (key === "language") {
      cfg.language = val;
    }
  }
  return cfg;
}

function loadFromFile(): TenantConfig {
  const configPath = path.join(os.homedir(), ".silva", "tenant.yaml");
  try {
    const content = fs.readFileSync(configPath, "utf-8");
    return parseSimpleYaml(content);
  } catch {
    return {};
  }
}

function loadFromEnv(): TenantConfig {
  return {
    name: process.env.SILVA_TENANT_NAME,
    description: process.env.SILVA_TENANT_DESCRIPTION,
    teamInfo: process.env.SILVA_TENANT_TEAM_INFO,
    language: process.env.SILVA_TENANT_LANG,
  };
}

/** Returns merged tenant config. Env vars override file values. */
export function loadTenantConfig(): TenantConfig {
  const fromFile = loadFromFile();
  const fromEnv = loadFromEnv();
  return {
    name: fromEnv.name ?? fromFile.name,
    description: fromEnv.description ?? fromFile.description,
    teamInfo: fromEnv.teamInfo ?? fromFile.teamInfo,
    language: fromEnv.language ?? fromFile.language,
  };
}
