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

Refresh from upstream:

```bash
# Fetch the latest syntax.json / syntax-errors.json from the MF2 WG repo.
npm run conformance:update

# Run the suite against the refreshed fixtures.
npm run test:conformance
```

`npm run conformance:update` accepts `--ref <tag|branch|sha>` to pin a specific upstream revision; without it the script tracks `main`. Use `npm run conformance:check` to exit non-zero on drift without writing anything — that's what the scheduled `conformance-drift` workflow runs weekly.

If new tests fail, the grammar needs updating. Do not "fix" the conformance files to match the grammar — the spec is authoritative.

## Tree shape changes

Node names like `variable_expression`, `unquoted_literal`, `function` etc. appear in downstream highlight queries, indent queries, and the Elixir / JS consumers' pattern-matching code. **Renaming a node is a breaking change.**

If you must rename:

1. Update `queries/*.scm` to use the new names.
2. Update the corpus tests.
3. Run the downstream syncs; update their queries and code.
4. Document the rename in `CHANGELOG.md` under a "Tree shape changes" section.

## Publishing to npm

Only repo maintainers publish. Publishing is driven by the `release.yml` GitHub Actions workflow: pushing a `v*` tag triggers a multi-OS prebuilt-binary matrix build, then a final job that downloads every prebuild, stages them under `prebuilds/`, and runs `npm publish --provenance`. End users on Linux x64/arm64, macOS x64/arm64, or Windows x64 skip node-gyp entirely at install time because `node-gyp-build` finds the matching prebuild.

### One-time trusted-publisher setup on npm

This repo authenticates to npm via **Trusted Publishing** (OIDC) rather than a stored token. Before the first publish, a maintainer with npm publish rights configures the trust relationship once:

1. Sign in to [npmjs.com](https://www.npmjs.com); keep 2FA enabled.
2. Go to `https://www.npmjs.com/settings/<username>/packages` → **Trusted publishers** → **Add trusted publisher**.
3. Fill in:
   - Publisher: **GitHub Actions**
   - Organization or user: `elixir-localize`
   - Repository: `mf2_treesitter`
   - Workflow filename: `release.yml`
   - Environment: *(leave blank)*
   - Package name: `tree-sitter-mf2`
4. Save. npm reserves the package name against this workflow.

No `NPM_TOKEN` secret is required. The workflow authenticates via the short-lived OIDC identity token GitHub issues to the job at run time.

### Release flow

```bash
# 1. Verify CI is green on main.
# 2. Bump version in package.json (respect SemVer — tree-shape changes = major).
npm version patch   # or minor, or major. Creates a commit + git tag.
# 3. Push commit and tag; the release workflow takes over from here.
git push --follow-tags
```

To run the prebuild matrix without publishing (for validation), trigger `release.yml` via `workflow_dispatch` — it runs the prebuild jobs and skips the publish job.

The `prepublishOnly` npm script also runs `tree-sitter generate` + `npm run build-wasm` + `npm test` as a local safety net for anyone running `npm publish` manually.

## Licence

Apache-2.0. By contributing you agree that your contributions are licenced under the same terms.
