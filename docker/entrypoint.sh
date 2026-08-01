#!/bin/sh
set -e

if [ ! -d node_modules/expo ]; then
  echo "[setup] node_modules is missing - running 'npm ci' (first run only, ~1-2 min)..."
  npm ci
  echo "[setup] dependencies installed."
fi

exec "$@"
