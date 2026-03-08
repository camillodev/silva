/**
 * replyInThread — Silva POC (ENG-135)
 *
 * Sends a reply always in thread. Silva NEVER posts to the main channel.
 * If no threadTs is provided, uses the original message ts as thread root.
 *
 * Usage:
 *   await replyInThread(client, token, channel, messageTs, "Olá!");
 */

import type { WebClient } from "@slack/web-api";

export async function replyInThread(
  client: WebClient,
  token: string,
  channel: string,
  /** ts of the original message — becomes the thread root */
  threadTs: string,
  text: string,
): Promise<{ ts: string | undefined }> {
  const result = await client.chat.postMessage({
    token,
    channel,
    thread_ts: threadTs,
    text,
  });
  return { ts: result.ts };
}

/**
 * Detect approval intent from user message.
 * Returns true if the message looks like a "yes/approve/ok".
 */
export function isApprovalIntent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return /^(ok|okay|sim|yes|yeah|yep|perfeito|pode|confirma|confirmo|aprovado|aprova|valeu|pode ser|claro|ótimo|otimo|exato|isso|manda|vai|bora|show)[\s!.]*$/.test(
    normalized,
  );
}

/**
 * Detect cancel intent from user message.
 * Returns true if the message looks like a "no/cancel/stop".
 */
export function isCancelIntent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return /^(nao|não|no|nope|cancela|cancelar|cancelado|para|pare|stop|esquece|esquece isso|deixa|deixa pra la|deixa pra lá|aborta|abortar|desiste)[\s!.]*$/.test(
    normalized,
  );
}
