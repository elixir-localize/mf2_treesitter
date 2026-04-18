# Contributing

This repo holds the tree-sitter grammar for ICU MessageFormat 2.0. Downstream packages vendor its output — changes here propagate to the Elixir NIF, the browser editor, and the editor extensions. Keep that in mind when editing.

## Development setup

```bash
git clone https://github.com/elixir-localize/mf2_treesitter
cd mf2_treesitter
npm install
```

This pulls the tree-sitter CLI into `node_modules/.bin/tree-sitter`. You do not need a global tree-sitter install.

For WASM builds, you need one of:

- **emscripten** — `brew install emscripten` on macOS, package manager equivalent on Linux.
- **Docker** (or Podman) — the tree-sitter CLI will automatically run emscripten in a container when no local `emcc` is available. `open -a Docker` on macOS if Docker Desktop is installed but not running.

## Editing the grammar

**`grammar.js` is the only file you edit.** Everything under `src/` and `wasm/` is generated output; never edit those by hand.

After editing `grammar.js`:

```bash
# Regenerate parser.c + grammar.json + node-types.json.
npm run generate

# Regenerate the WASM.
npm run build-wasm

# Run all tests (CLI corpus + MF2 WG conformance).
npm test
```

All three must pass before pushing. CI checks each of them.

Alternatively, `./scripts/build.sh` runs all three in sequence.

## Testing

Three layers:

1. **CLI corpus** (`test/corpus/*.txt`) — tree-sitter's native test format. One test per named block; expected output is an S-expression. Run with `npm run test:corpus`. Add cases here for shapes you care about at the tree level.

2. **MF2 WG conformance** (`test/conformance/syntax.json`, `syntax-errors.json`) — the official spec suite, vendored from [`unicode-org/message-format-wg`](https://github.com/unicode-org/message-format-wg/tree/main/test). Run with `npm run test:conformance`. The runner asserts parse-clean vs has-error for every case. **Do not edit these JSONs by hand** — pull them fresh from the upstream repo.

3. **Downstream packages** — whenever grammar output changes, resync:
   - `cd ../localize_mf2_treesitter && mix localize_mf2_treesitter.sync && mix test`
   - `cd ../mf2_wasm_editor && mix mf2_wasm_editor.sync && mix test`

Both should stay green.

## Adding to the test corpus

Corpus format (from any file in `test/corpus/`):

```
================
descriptive test name
================
<MF2 source, possibly multi-line>
---

<expected S-expression tree>
```

Write the source, save the file, run `npm run test:corpus`. It will print the actual S-expression alongside yours; copy the actual into the expected slot once you've verified it's correct.

## Updating the conformance suite

Periodically refresh from upstream:

```bash
curl -sL https://raw.githubusercontent.com/unicode-org/message-format-wg/main/test/tests/syntax.json > test/conformance/syntax.json
curl -sL https://raw.githubusercontent.com/unicode-org/message-format-wg/main/test/tests/syntax-errors.json > test/conformance/syntax-errors.json
npm run test:conformance
```

If new tests fail, the grammar needs updating. Do not "fix" the conformance files to match the grammar — the spec is authoritative.

## Tree shape changes

Node names like `variable_expression`, `unquoted_literal`, `function` etc. appear in downstream highlight queries, indent queries, and the Elixir / JS consumers' pattern-matching code. **Renaming a node is a breaking change.**

If you must rename:

1. Update `queries/*.scm` to use the new names.
2. Update the corpus tests.
3. Run the downstream syncs; update their queries and code.
4. Document the rename in `CHANGELOG.md` under a "Tree shape changes" section.

## Publishing to npm

Only repo maintainers publish. Flow:

```bash
# 1. Verify CI is green on main.
# 2. Bump version (respect SemVer — tree-shape changes = major).
npm version patch   # or minor, or major
# 3. Publish.
npm publish
# 4. Tag and push.
git push --follow-tags
```

`npm publish` runs `npm test` and `npm pack` locally first. CI's `npm-pack.yml` job dry-runs the same thing on every PR so surprises are caught before the merge.

## Licence

Apache-2.0. By contributing you agree that your contributions are licenced under the same terms.
