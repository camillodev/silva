/**
 * SlackReactionManager — Silva POC (ENG-135)
 *
 * Manages emoji reactions as a state machine:
 *   ⏳ (hourglass_flowing_sand) — Silva is processing (set immediately, <500ms)
 *   👀 (eyes)                   — Silva is working on tool calls (swap if task >3s)
 *
 * Rules:
 * - Never more than one Silva reaction at a time
 * - Always clear Silva reactions before replying
 * - ✅ and ❌ are USER reactions — Silva never sets them
 */

import type { WebClient } from "@slack/web-api";
import { removeOwnSlackReactions } from "./actions.js";

const PROCESSING_EMOJI = "hourglass_flowing_sand"; // ⏳
const WORKING_EMOJI = "eyes"; // 👀
const SWAP_THRESHOLD_MS = 3000;

export class SlackReactionManager {
  private client: WebClient;
  private token: string;
  private currentEmoji: string | null = null;
  private swapTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(client: WebClient, token: string) {
    this.client = client;
    this.token = token;
  }

  /** Set a reaction emoji, removing any previous Silva reaction first. */
  async set(emoji: string, channel: string, ts: string): Promise<void> {
    await this.clearSilvaReactions(channel, ts);
    await this.client.reactions.add({
      token: this.token,
      channel,
      timestamp: ts,
      name: emoji,
    });
    this.currentEmoji = emoji;
  }

  /**
   * Start processing state: set ⏳ immediately.
   * If task takes longer than 3s, swap to 👀 automatically.
   */
  async startProcessing(channel: string, ts: string): Promise<void> {
    await this.set(PROCESSING_EMOJI, channel, ts).catch(() => {});
    // Schedule swap to 👀 if still processing after threshold
    this.swapTimer = setTimeout(async () => {
      if (this.currentEmoji === PROCESSING_EMOJI) {
        await this.set(WORKING_EMOJI, channel, ts).catch(() => {});
      }
    }, SWAP_THRESHOLD_MS);
  }

  /** Keep thread marked as in-progress with 👀. */
  async setWorking(channel: string, ts: string): Promise<void> {
    await this.set(WORKING_EMOJI, channel, ts).catch(() => {});
  }

  /** Clear all Silva-owned reactions (⏳ and 👀). */
  async clearSilvaReactions(channel: string, ts: string): Promise<void> {
    if (this.swapTimer) {
      clearTimeout(this.swapTimer);
      this.swapTimer = null;
    }
    this.currentEmoji = null;
    await removeOwnSlackReactions(channel, ts, {
      token: this.token,
      client: this.client,
    }).catch(() => {});
  }

  /** Call when processing is done — clears reactions before reply goes out. */
  async done(channel: string, ts: string): Promise<void> {
    await this.clearSilvaReactions(channel, ts);
  }
}
