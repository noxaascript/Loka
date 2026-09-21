#!/usr/bin/env bash
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js tidak terinstall."
  echo "Install: https://nodejs.org/"
  exit 1
fi

node setup.mjs
