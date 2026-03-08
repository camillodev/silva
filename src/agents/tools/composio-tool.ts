import { Type } from "@sinclair/typebox";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, ToolInputError } from "./common.js";

const COMPOSIO_ACTIONS = ["execute", "list_apps", "list_actions"] as const;

// Flattened schema — no Type.Union/anyOf/oneOf (provider-safe)
const ComposioToolSchema = Type.Object(
  {
    action: stringEnum(COMPOSIO_ACTIONS),
    // For action="execute"
    composioAction: Type.Optional(Type.String()),
    appName: Type.Optional(Type.String()),
    params: Type.Optional(Type.Object({}, { additionalProperties: true })),
    connectedAccountId: Type.Optional(Type.String()),
    entityId: Type.Optional(Type.String()),
    // For action="list_actions"
    filterByApp: Type.Optional(Type.String()),
  },
  { additionalProperties: true },
);

const BASE_URL = "https://backend.composio.tools/api/v1";

function getApiKey(): string {
  const key = process.env.COMPOSIO_API_KEY?.trim();
  if (!key) {
    throw new ToolInputError("Composio API key not configured. Set COMPOSIO_API_KEY in .env");
  }
  return key;
}

function composioHeaders(apiKey: string): Record<string, string> {
  return {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

export function createComposioTool(): AnyAgentTool {
  return {
    label: "composio",
    name: "composio",
    description: `Execute actions on 100+ apps (Gmail, Notion, Linear, GitHub, Slack, etc.) via Composio.
Use action="list_apps" to discover available integrations.
Use action="list_actions" with filterByApp to find specific action IDs.
Use action="execute" with composioAction (e.g. "GMAIL_SEND_EMAIL") and params to run an action.
The user must connect apps at https://app.composio.dev before they can be used.`,
    parameters: ComposioToolSchema,
    execute: async (_toolCallId, args) => {
      const p = args as Record<string, unknown>;
      const action = typeof p.action === "string" ? p.action : "";

      try {
        const apiKey = getApiKey();

        switch (action) {
          case "execute": {
            const composioAction =
              typeof p.composioAction === "string" ? p.composioAction.trim() : "";
            if (!composioAction) {
              throw new ToolInputError(
                'composioAction is required for action="execute" (e.g. "GMAIL_SEND_EMAIL")',
              );
            }

            // Nested params object carries input fields, entityId, and connectedAccountId
            const innerParams =
              typeof p.params === "object" && p.params !== null
                ? (p.params as Record<string, unknown>)
                : {};

            const entityId =
              typeof p.entityId === "string" && p.entityId.trim()
                ? p.entityId.trim()
                : typeof innerParams.entityId === "string" && innerParams.entityId.trim()
                  ? innerParams.entityId.trim()
                  : "default";

            const connectedAccountId =
              typeof p.connectedAccountId === "string" && p.connectedAccountId.trim()
                ? p.connectedAccountId.trim()
                : typeof innerParams.connectedAccountId === "string" &&
                    innerParams.connectedAccountId.trim()
                  ? innerParams.connectedAccountId.trim()
                  : undefined;

            const body: Record<string, unknown> = {
              entityId,
              input: innerParams,
            };
            if (connectedAccountId) {
              body.connectedAccountId = connectedAccountId;
            }

            const res = await fetch(
              `${BASE_URL}/actions/${encodeURIComponent(composioAction)}/execute`,
              {
                method: "POST",
                headers: composioHeaders(apiKey),
                body: JSON.stringify(body),
              },
            );

            if (!res.ok) {
              const text = await res.text();
              return jsonResult({ status: "error", code: res.status, message: text });
            }

            const data: unknown = await res.json();
            return jsonResult({ status: "success", data });
          }

          case "list_apps": {
            const res = await fetch(`${BASE_URL}/apps`, {
              headers: composioHeaders(apiKey),
            });

            if (!res.ok) {
              const text = await res.text();
              return jsonResult({ status: "error", code: res.status, message: text });
            }

            const json: unknown = await res.json();
            // Extract name/key/description from items array
            const items = Array.isArray(json)
              ? json
              : typeof json === "object" &&
                  json !== null &&
                  Array.isArray((json as Record<string, unknown>).items)
                ? (json as Record<string, unknown>).items
                : [];

            const apps = (items as unknown[])
              .filter(
                (item): item is Record<string, unknown> =>
                  typeof item === "object" && item !== null,
              )
              .map((item) => ({
                name: typeof item.name === "string" ? item.name : "",
                key: typeof item.key === "string" ? item.key : "",
                description: typeof item.description === "string" ? item.description : "",
              }));

            return jsonResult({ apps });
          }

          case "list_actions": {
            const filterByApp = typeof p.filterByApp === "string" ? p.filterByApp.trim() : "";
            const url = filterByApp
              ? `${BASE_URL}/actions?appName=${encodeURIComponent(filterByApp)}`
              : `${BASE_URL}/actions`;

            const res = await fetch(url, {
              headers: composioHeaders(apiKey),
            });

            if (!res.ok) {
              const text = await res.text();
              return jsonResult({ status: "error", code: res.status, message: text });
            }

            const json: unknown = await res.json();
            const items = Array.isArray(json)
              ? json
              : typeof json === "object" &&
                  json !== null &&
                  Array.isArray((json as Record<string, unknown>).items)
                ? (json as Record<string, unknown>).items
                : [];

            return jsonResult({ actions: items });
          }

          default:
            return jsonResult({ status: "error", message: `Unknown action: ${action}` });
        }
      } catch (err: unknown) {
        // ToolInputError is intentional — re-throw so agent sees a proper error
        if (err instanceof ToolInputError) {
          throw err;
        }
        // Network or unexpected errors — return gracefully
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ status: "error", message });
      }
    },
  };
}
