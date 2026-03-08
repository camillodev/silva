#!/usr/bin/env bash
# Quick gateway restart — kills the running openclaw gateway process and relaunches it.
# Uses the globally installed openclaw (npm install -g openclaw).
# Does NOT rebuild. Use this after config changes (workspace .md files, openclaw.json, .env).

set -euo pipefail

echo "==> Killing existing openclaw gateway..."
pkill -f "openclaw/dist/index.js gateway" 2>/dev/null || true
sleep 1

echo "==> Relaunching gateway..."
nohup openclaw gateway run --port 18789 > /tmp/openclaw-gateway.log 2>&1 &

echo "✅ Gateway relaunched (PID $!). Logs: /tmp/openclaw-gateway.log"
