#!/usr/bin/env bash
#
# Regenerate the generated artefacts checked into this repo:
#
#   * src/parser.c, src/grammar.json, src/node-types.json       (via `tree-sitter generate`)
#   * wasm/tree-sitter-mf2.wasm                                 (via `tree-sitter build --wasm`)
#
# Run whenever `grammar.js` changes. The tree-sitter CLI must be
# available — this script expects it under node_modules (installed
# by `npm install` in this directory). `tree-sitter build --wasm`
# additionally needs one of: `emcc` on PATH, Docker, or Podman.
#
# Consumers (mf2_wasm_editor, localize_mf2_treesitter, and each editor
# extension in mf2_editor_extensions) vendor or reference the checked-
# in artefacts from here — they do NOT regenerate on their own builds.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -x "./node_modules/.bin/tree-sitter" ]; then
  echo "tree-sitter CLI not installed. Run: npm install" >&2
  exit 1
fi

echo "==> Regenerating src/ via tree-sitter generate"
./node_modules/.bin/tree-sitter generate

echo "==> Building wasm/tree-sitter-mf2.wasm via tree-sitter build --wasm"
./node_modules/.bin/tree-sitter build --wasm --output wasm/tree-sitter-mf2.wasm

echo "==> Running test suite"
./node_modules/.bin/tree-sitter test

echo "done."
