#!/bin/sh
set -eu
cd /workspace
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
export VITE_AUTH_ENABLED=false
npx vite dev --host 0.0.0.0 --port 8080 --force >>/tmp/vite8080.log 2>&1 &
sleep 3
