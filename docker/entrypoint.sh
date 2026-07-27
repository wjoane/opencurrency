#!/bin/sh
# Alpine ships busybox ash, not bash. Keep this POSIX.
set -e

# Probe for a real package rather than the directory itself, so a partially
# populated or wiped-out node_modules still triggers a reinstall.
if [ ! -d node_modules/expo ]; then
  echo "[setup] node_modules is missing - running 'npm ci' (first run only, ~1-2 min)..."
  npm ci
  echo "[setup] dependencies installed."
fi

exec "$@"
