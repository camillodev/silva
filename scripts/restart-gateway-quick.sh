#!/usr/bin/env bash
# Quick gateway restart — kills the running OpenClaw app and relaunches the
# already-built bundle. Does NOT rebuild Swift/Node. Use this after config
# changes (workspace .md files, openclaw.json, .env).
# For a full rebuild + resign, use scripts/restart-mac.sh.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_BUNDLE="${ROOT_DIR}/dist/OpenClaw.app"

if [ ! -d "$APP_BUNDLE" ]; then
  echo "❌ App bundle not found at $APP_BUNDLE — run scripts/restart-mac.sh first to build it."
  exit 1
fi

echo "==> Killing existing OpenClaw instances..."
pkill -f "OpenClaw.app/Contents/MacOS/OpenClaw" 2>/dev/null || true
sleep 1

echo "==> Launching $APP_BUNDLE..."
open "$APP_BUNDLE"

echo "✅ Gateway relaunched (no rebuild). Config changes are live."
