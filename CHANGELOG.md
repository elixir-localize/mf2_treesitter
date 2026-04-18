# Changelog

All notable changes to the MF2 tree-sitter grammar are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows [Semantic Versioning](https://semver.org/).

The language ABI version is currently `LANGUAGE_VERSION 14` (see the top of `src/parser.c`). Consumers loading the WASM must use `web-tree-sitter` 0.24 or later; the Elixir NIF consumer embeds a pinned tree-sitter runtime of the same major version.

## [0.1.0] — unreleased

### Highlights

First release. The package lifted out of `mf2_editor_extensions/tree-sitter-mf2/` as a standalone repo so that multiple downstream consumers (browser editor, Elixir NIF, language-specific editor extensions) can each vendor or sync from a single canonical source.

**Passes the full MF2 WG syntax conformance suite: 247/247 tests.** The [official conformance suite](https://github.com/unicode-org/message-format-wg/tree/main/test) lives under `test/conformance/`; the runner at `test/conformance/runner.js` is wired into `npm test` alongside the corpus tests.

### Spec conformance

Grammar matches the current [UTS #35 Part 3 ABNF](https://github.com/unicode-org/message-format-wg/blob/main/spec/message.abnf) with no known gaps:

* **Full Unicode name-start and name-char ranges** — every range from `%xA1-61B` through `%x100000-10FFFD`, including all supplementary planes. Supports identifiers in CJK, Hangul, emoji, and other non-BMP scripts.
* **Bidirectional control characters** (`U+061C`, `U+200E`, `U+200F`, `U+2066-2069`) handled in whitespace and around name tokens per the spec's `[bidi]` productions.
* **IDEOGRAPHIC SPACE** (`U+3000`) recognised as whitespace alongside SP/HTAB/CR/LF.
* **Unified `escaped-char`** — `\\`, `\{`, `\}`, `\|` valid in both text and quoted-literal contexts.
* **`simple-start-char` corrected** — no longer excludes `@` at pattern start; `@` is legal there per the current spec.
* **`function`, `function_expression`** naming matches the current spec (renamed from the older `annotation`, `annotation_expression` drafts).
* **`unquoted_literal`** accepts the full `1*name-char` production, including digit-starting and `-`/`.`-starting strings like `42`, `1.2.3`, `-hello`. Previously restricted to the subset covered by `number_literal` + `name`.
* **`attribute`** value restricted to `literal` only (variables removed per current spec).

Not in the current spec (and thus not implemented): `reserved-statement`, `reserved-annotation`, `private-use-annotation`. These productions existed in earlier drafts but were removed before the final UTS #35.

### Contents of the published npm artefact

* `grammar.js` — the grammar source of truth.
* `src/parser.c`, `src/grammar.json`, `src/node-types.json`, `src/tree_sitter/parser.h` — output of `tree-sitter generate`. Regenerate via `scripts/build.sh`.
* `wasm/tree-sitter-mf2.wasm` — output of `tree-sitter build --wasm`. Regenerate via `scripts/build.sh` (needs emscripten / Docker / Podman on PATH).
* `queries/highlights.scm` — language-agnostic capture query used for syntax highlighting. Numeric-looking unquoted literals are captured as `@number` via a `#match?` predicate; everything else as `@string`.
* `test/corpus/*.txt` — 16-test tree-sitter CLI corpus covering every production.
* `test/conformance/syntax.json`, `test/conformance/syntax-errors.json` — vendored from the MF2 WG repo. 114 valid-input tests + 133 invalid-input tests.
* `test/conformance/runner.js` — Node.js runner that loads the WASM via web-tree-sitter and asserts `hasError` matches expected verdict for every conformance case.

### Test scripts

* `npm run test:corpus` — tree-sitter CLI corpus (16 cases).
* `npm run test:conformance` — MF2 WG conformance runner (247 cases).
* `npm test` — both of the above.

### Migration from mf2_editor_extensions/tree-sitter-mf2

All grammar-related files moved here. Downstream consumers that previously referenced `mf2_editor_extensions/tree-sitter-mf2/...` should repoint at `mf2_treesitter/...`. The canonical vendor/sync targets are:

* **Elixir NIF** (`localize_mf2_treesitter`): vendors `src/parser.c`, `src/tree_sitter/parser.h`, plus `queries/highlights.scm`.
* **Browser editor** (`mf2_wasm_editor`): vendors `wasm/tree-sitter-mf2.wasm`, the grammar source, and `queries/highlights.scm`.
* **Editor extensions** (`mf2_editor_extensions`): points at this repo's GitHub URL for grammar source; ships its own Elixir-specific injection queries alongside.

### Tree shape changes from the pre-extraction version

The following node names changed to match the current spec:

* `annotation_expression` → `function_expression`
* `annotation` → removed (use `function` directly)
* `number_literal` → removed (all numeric-looking strings are now `unquoted_literal` content, classified via `#match?` predicate in queries)

Downstream consumers that pattern-matched against these names need updates. The highlight query shipped with this release uses the new names; any custom queries must follow suit.

### Editor queries

Full set of standard editor queries under `queries/`:

* **`highlights.scm`** — syntax highlighting. Capture names follow nvim-treesitter / Helix conventions (`@variable`, `@function`, `@keyword.conditional`, etc.). Numeric-looking unquoted literals captured as `@number` via a `#match?` predicate.
* **`locals.scm`** — lexical scoping. `complex_message` is the scope; `.local $x = …` and `.input {$x …}` are definitions; `$x` references are captured. Unlocks goto-definition and rename in tree-sitter-aware editors.
* **`folds.scm`** — `matcher`, `quoted_pattern`, and `variant` nodes are foldable regions.
* **`indents.scm`** — nvim-treesitter-style auto-indent. Increments at `quoted_pattern` and `matcher`; decrements at `}}`; variants align at the matcher column.
* **`injections.scm`** — intentionally minimal; MF2 messages are self-contained. Elixir-specific injection rules for `~M` sigils live in the sibling [`mf2_editor_extensions`](https://github.com/elixir-localize/mf2_editor_extensions) repo.
* **`tags.scm`** — ctags-style symbol outline. `.local` and `.input` bindings are tagged as `@definition.variable`.

### Node.js bindings

`bindings/node/` ships a native binding for [`node-tree-sitter`](https://www.npmjs.com/package/tree-sitter) consumers. `require('tree-sitter-mf2')` returns `{name, language}` where `language` is a `TSLanguage` external object passable to `Parser.setLanguage`. Build via `node-gyp-build` at install time; prebuilt binaries can be added later via `prebuildify`.

`web-tree-sitter` consumers don't use this binding — they load `wasm/tree-sitter-mf2.wasm` directly. Both paths work.

### CI

Four GitHub Actions workflows guard against common drift:

* **`test.yml`** — runs `tree-sitter test` (corpus) and the MF2 WG conformance suite on Linux, macOS, and Windows runners.
* **`generate.yml`** — regenerates `src/parser.c` from `grammar.js` and fails the build if the committed parser differs. Stops the footgun of editing `grammar.js` without regenerating.
* **`wasm.yml`** — rebuilds `wasm/tree-sitter-mf2.wasm` and verifies no drift, then runs the conformance suite against the fresh WASM.
* **`npm-pack.yml`** — dry-runs `npm publish` and verifies every file declared in `package.json`'s `files` array is actually in the tarball.

### Contributing guide

`CONTRIBUTING.md` documents the local dev setup (`npm install`, emscripten/Docker for WASM builds), the edit-generate-test cycle, how to add corpus tests, how to refresh the conformance suite from upstream, and the publish flow.
