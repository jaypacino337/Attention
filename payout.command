#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js is not installed yet."
  echo "  Go to nodejs.org, click the green LTS button, install it,"
  echo "  then double-click this file again."
  echo ""
  read -r -p "Press Enter to close"
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Installing... one minute, first time only."
  npm install --no-audit --no-fund
fi
node scripts/easy.mjs
echo ""
read -r -p "Press Enter to close"
