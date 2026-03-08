import { Type } from "@sinclair/typebox";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, ToolInputError, jsonResult } from "./common.js";

const PIPEDREAM_ACTIONS = ["trigger", "list_workflows"] as const;

// Flattened schema — no Union/anyOf so all providers accept it.
const PipedreamToolSchema = Type.Object(
  {
    action: stringEnum(PIPEDREAM_ACTIONS),
    // For action="trigger"
    workflowUrl: Type.Optional(Type.String()),
    event: Type.Optional(Type.String()),
    payload: Type.Optional(Type.Object({}, { additionalProperties: true })),
    // For action="list_workflows" — uses PIPEDREAM_API_KEY env var (no param needed)
  },
  { additionalProperties: true },
);

type PipedreamWorkflow = {
  id: string;
  name: string;
};

type PipedreamListResponse = {
  data: PipedreamWorkflow[];
};

export function createPipedreamTool(): AnyAgentTool {
  return {
    label: "pipedream",
    name: "pipedream",
    description: `Trigger Pipedream workflows or list available workflows.
Use action="trigger" with workflowUrl (the webhook URL from Pipedream) to fire a workflow.
Use action="list_workflows" to see available workflows (requires PIPEDREAM_API_KEY).
Pipedream connects to 2000+ apps — use this to start multi-step automations.`,
    parameters: PipedreamToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = typeof params.action === "string" ? params.action : "";

      switch (action) {
        case "trigger": {
          const workflowUrl =
            typeof params.workflowUrl === "string" ? params.workflowUrl.trim() : "";
          if (!workflowUrl) {
            throw new ToolInputError("workflowUrl required for action=trigger");
          }

          const payload =
            params.payload !== null &&
            typeof params.payload === "object" &&
            !Array.isArray(params.payload)
              ? (params.payload as Record<string, unknown>)
              : {};

          const body = {
            event: typeof params.event === "string" ? params.event : "silva.trigger",
            ...payload,
            _source: "silva",
            _timestamp: new Date().toISOString(),
          };

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          // Optionally authenticate webhook requests with a shared secret
          const secret = process.env.PIPEDREAM_WEBHOOK_SECRET;
          if (secret) {
            headers["x-pd-secret"] = secret;
          }

          const res = await fetch(workflowUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          });

          return jsonResult({ status: "triggered", workflowUrl, httpStatus: res.status });
        }

        case "list_workflows": {
          const apiKey = process.env.PIPEDREAM_API_KEY;
          if (!apiKey) {
            return jsonResult({ message: "Set PIPEDREAM_API_KEY to list workflows" });
          }

          const res = await fetch("https://api.pipedream.com/v1/workflows", {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

          const data = (await res.json()) as PipedreamListResponse;
          return jsonResult({
            workflows: data.data.map((w) => ({ id: w.id, name: w.name })),
          });
        }

        default:
          throw new ToolInputError(`Unknown action: ${action}`);
      }
    },
  };
}
