#!/usr/bin/env bash
# Silva dev gateway startup script.
#
# What this does:
# 1. Sources .env from the project root so SLACK_BOT_TOKEN and SLACK_APP_TOKEN
#    are in the environment before the gateway starts.
# 2. Runs `gateway run --dev` which creates ~/.openclaw/openclaw.json with
#    gateway.mode=local if it does not exist yet, then boots the gateway.
# 3. The Slack plugin reads SLACK_BOT_TOKEN + SLACK_APP_TOKEN from the
#    environment (via src/slack/accounts.ts resolveSlackAccount) and connects
#    in Socket Mode (the default when appToken is present).
#
# Prerequisites:
#   - pnpm install must have been run in the project root.
#   - .env must contain SLACK_BOT_TOKEN and SLACK_APP_TOKEN.
#   - The Slack app must have Socket Mode enabled and the app token must start
#     with xapp-. The bot token must start with xoxb-.
#
# Usage:
#   bash scripts/start-dev.sh
#
# To allow access from another machine (LAN), change --bind loopback to --bind lan
# and add --token <some-long-token> (required when binding beyond loopback).

set -e
cd "$(dirname "$0")/.."

# Load .env from project root (without clobbering env vars already set by shell).
if [ -f .env ]; then
  # export each KEY=VALUE line that is not a comment or blank.
  while IFS= read -r line || [ -n "$line" ]; do
    # skip blank lines and comments
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    # only export lines that look like VARNAME=...
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      export "$line"
    fi
  done < .env
fi

# Validate required Slack tokens
if [ -z "$SLACK_BOT_TOKEN" ]; then
  echo "ERROR: SLACK_BOT_TOKEN is not set. Add it to .env" >&2
  exit 1
fi
if [ -z "$SLACK_APP_TOKEN" ]; then
  echo "ERROR: SLACK_APP_TOKEN is not set. Add it to .env" >&2
  exit 1
fi

echo "[silva] Starting gateway in Slack Socket Mode..."
echo "[silva]   BOT_TOKEN : ${SLACK_BOT_TOKEN:0:14}..."
echo "[silva]   APP_TOKEN : ${SLACK_APP_TOKEN:0:14}..."
echo "[silva]   Config    : ~/.openclaw/openclaw.json (created by --dev if missing)"

# --dev: auto-creates ~/.openclaw/openclaw.json with gateway.mode=local if missing.
# --bind loopback: safe default; the Slack connection is outbound so local binding is fine.
# --verbose: show channel startup logs so you can confirm Slack connects.
exec node scripts/run-node.mjs gateway run \
  --dev \
  --bind loopback \
  --verbose
