#!/bin/bash
# One-shot build + restart for dashboard-me on :3001.
# Tweak PORT/HOST below for your environment.

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PORT="${PORT:-3001}"
HOST="${HOST:-0.0.0.0}"

cd "$DIR"

echo "🔨 Building..."
npm run build

echo "🔄 Restarting server on :$PORT..."
# Kill whatever is on $PORT — works on macOS (lsof) and Linux (fuser as fallback).
lsof -ti :"$PORT" 2>/dev/null | xargs kill -9 2>/dev/null \
  || (command -v fuser >/dev/null && fuser -k "$PORT"/tcp 2>/dev/null) \
  || true
pkill -f "next start.*$PORT" 2>/dev/null || true
sleep 1

nohup npx next start -H "$HOST" -p "$PORT" > server.log 2>&1 &
echo $! > server.pid
sleep 3

if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q "200"; then
  echo "✅ dashboard-me running at http://localhost:$PORT"
else
  echo "❌ Failed to start, check server.log"
  exit 1
fi
