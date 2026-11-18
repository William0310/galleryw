#!/bin/bash
# Double-click to open the Wphoto admin (edits captions, album text, About and Newsroom).
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then echo "Node.js is required: https://nodejs.org"; read -n 1; exit 1; fi
node admin/server.mjs
