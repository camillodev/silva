/**
 * Draft Approval Tool — ENG-116
 *
 * Allows the agent to gate write actions behind Slack Block Kit approval buttons.
 * Before executing any sensitive action (Composio write, Pipedream trigger, email send, etc.),
 * the agent calls this tool with action="create" to show a preview card + Approve/Reject buttons.
 *
 * After the user clicks a button, the existing Slack interaction handler fires
 * and enqueues a system event like:
 *   Slack interaction: {"actionId": "openclaw:draft:approve:a1b2c3d4", ...}
 *
 * The agent reads this event to decide whether to proceed or abort.
 *
 * Permission levels (to be respected by the agent via system prompt):
 *   auto            — Execute immediately, no approval needed (reads, searches)
 *   specific_approval — Show Block Kit card with full action details (default for writes)
 *   broad_approval  — Show simplified card (bulk/batch operations)
 *   forbidden       — Block with message, never execute
 */

import { Type } from "@sinclair/typebox";
import { loadConfig } from "../../config/config.js";
import { resolveSlackAccount } from "../../slack/accounts.js";
import { createSlackWebClient } from "../../slack/client.js";
import {
  DRAFT_APPROVE_PREFIX,
  DRAFT_REJECT_PREFIX,
  createDraft,
  deleteDraft,
  getDraft,
  patchDraftMessageTs,
} from "../../slack/draft-approval.js";
import { resolveSlackBotToken } from "../../slack/token.js";
import { stringEnum } from "../schema/typebox.js";
import { ToolInputError, jsonResult, readStringParam } from "./common.js";
import type { AnyAgentTool } from "./common.js";

const DRAFT_ACTIONS = ["create", "cancel", "check"] as const;

const DraftToolSchema = Type.Object(
  {
    action: stringEnum(DRAFT_ACTIONS, {
      description:
        "create: send Block Kit approval card; cancel: remove pending draft; check: get draft status",
    }),
    description: Type.Optional(
      Type.String({
        description:
          "Human-readable description of the action to be approved. Required for action=create.",
      }),
    ),
    channelId: Type.Optional(
      Type.String({
        description:
          "Slack channel ID to send the approval card. Defaults to current channel if not provided.",
      }),
    ),
    threadTs: Type.Optional(
      Type.String({
        description:
          "Slack thread timestamp to post the approval card into. Defaults to current thread.",
      }),
    ),
    draftId: Type.Optional(
      Type.String({
        description: "Draft ID to cancel or check. Required for action=cancel and action=check.",
      }),
    ),
  },
  { additionalProperties: true },
);

export function createDraftTool(options?: {
  /** Slack account ID (maps to channels.slack.accounts.<id>). Defaults to "default". */
  slackAccountId?: string;
  /** Current Slack channel ID (auto-filled from message context). */
  currentChannelId?: string;
  /** Current Slack thread timestamp (auto-filled from message context). */
  currentThreadTs?: string;
}): AnyAgentTool {
  return {
    name: "draft_approval",
    label: "Draft Approval",
    description:
      "Gate sensitive write actions behind user approval via Slack Block Kit buttons. " +
      "Call action=create before any Composio write, Pipedream trigger, or other irreversible action. " +
      "After creation, wait for the system event 'Slack interaction: {actionId: openclaw:draft:approve:ID}' " +
      "to confirm approval, or 'openclaw:draft:reject:ID' to abort. " +
      "action=cancel removes a pending draft. action=check returns the current draft status.",
    parameters: DraftToolSchema,

    execute: async (_toolCallId, args) => {
      const p = args as Record<string, unknown>;
      const action = typeof p.action === "string" ? p.action : "";

      // ── CREATE ────────────────────────────────────────────────────────────
      if (action === "create") {
        const description = readStringParam(p, "description", { required: true });
        const channelId = readStringParam(p, "channelId") ?? options?.currentChannelId;
        const threadTs = readStringParam(p, "threadTs") ?? options?.currentThreadTs;

        if (!channelId) {
          throw new ToolInputError(
            "channelId is required for draft creation. Pass channelId or ensure the tool has currentChannelId context.",
          );
        }

        // Resolve Slack client using the configured bot token.
        const cfg = loadConfig();
        const account = resolveSlackAccount({ cfg, accountId: options?.slackAccountId });
        const token = resolveSlackBotToken(account.botToken ?? undefined);
        if (!token) {
          throw new ToolInputError(
            "Slack bot token not configured. Set SLACK_BOT_TOKEN or channels.slack.accounts.default.botToken.",
          );
        }

        const draft = createDraft({ description, channelId, threadTs });

        try {
          const client = createSlackWebClient(token);
          const postResult = await client.chat.postMessage({
            channel: channelId,
            ...(threadTs ? { thread_ts: threadTs } : {}),
            text: `Pronto para executar: ${description}`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `🚀 *Pronto para executar:*\n${description}`,
                },
              },
              {
                type: "actions",
                block_id: `draft_actions_${draft.id}`,
                elements: [
                  {
                    type: "button",
                    text: { type: "plain_text", text: "✅ Aprovar", emoji: true },
                    style: "primary",
                    action_id: `${DRAFT_APPROVE_PREFIX}${draft.id}`,
                    value: draft.id,
                  },
                  {
                    type: "button",
                    text: { type: "plain_text", text: "❌ Rejeitar", emoji: true },
                    style: "danger",
                    action_id: `${DRAFT_REJECT_PREFIX}${draft.id}`,
                    value: draft.id,
                  },
                ],
              },
            ],
          });

          if (postResult.ts) {
            patchDraftMessageTs(draft.id, postResult.ts);
          }
        } catch (err) {
          // Clean up on failure so we don't leak draft state.
          deleteDraft(draft.id);
          throw new ToolInputError(`Failed to send Block Kit approval message: ${String(err)}`);
        }

        return jsonResult({
          draftId: draft.id,
          status: "pending",
          approveActionId: `${DRAFT_APPROVE_PREFIX}${draft.id}`,
          rejectActionId: `${DRAFT_REJECT_PREFIX}${draft.id}`,
          message:
            `Draft created and approval card sent. Wait for a system event with ` +
            `actionId="${DRAFT_APPROVE_PREFIX}${draft.id}" (approved) or ` +
            `"${DRAFT_REJECT_PREFIX}${draft.id}" (rejected) before proceeding. ` +
            `Draft expires in 10 minutes.`,
        });
      }

      // ── CANCEL ───────────────────────────────────────────────────────────
      if (action === "cancel") {
        const draftId = readStringParam(p, "draftId", { required: true });
        const existed = getDraft(draftId) !== undefined;
        deleteDraft(draftId);
        return jsonResult({
          draftId,
          status: "cancelled",
          existed,
        });
      }

      // ── CHECK ────────────────────────────────────────────────────────────
      if (action === "check") {
        const draftId = readStringParam(p, "draftId", { required: true });
        const draft = getDraft(draftId);
        if (!draft) {
          return jsonResult({
            draftId,
            status: "expired_or_not_found",
            message: "Draft not found or has expired (TTL: 10 minutes).",
          });
        }
        const ageMs = Date.now() - draft.createdAt;
        const remainingMs = Math.max(0, draft.ttlMs - ageMs);
        return jsonResult({
          draftId,
          status: "pending",
          description: draft.description,
          channelId: draft.channelId,
          ageMs,
          remainingMs,
          expiresIn: `${Math.round(remainingMs / 1000)}s`,
        });
      }

      throw new ToolInputError(`Unknown action: ${String(action)}`);
    },
  } satisfies AnyAgentTool;
}
