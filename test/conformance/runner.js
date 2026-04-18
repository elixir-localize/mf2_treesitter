#!/usr/bin/env node
/*
 * MF2 WG conformance runner.
 *
 * Loads the grammar's compiled WASM via `web-tree-sitter` and exercises
 * it against the official test suite maintained at:
 *
 *   https://github.com/unicode-org/message-format-wg/tree/main/test
 *
 * We consume two files, vendored under `test/conformance/`:
 *
 *   syntax.json         — messages that MUST parse successfully.
 *   syntax-errors.json  — messages that MUST fail parsing.
 *
 * "Success" is defined as `rootNode.hasError === false` after parse.
 * "Failure" is any combination of tree-sitter reporting `hasError`
 * on the root (including MISSING or ERROR nodes anywhere in the tree).
 *
 * Exits 0 if every case matches its expected verdict, 1 otherwise.
 * Failed cases are printed to stderr with the raw source and the
 * offending tree's S-expression for diagnosis.
 */

const fs = require('fs');
const path = require('path');

// web-tree-sitter lives at the top-level node_modules (same version
// as the tree-sitter CLI we pinned). The 0.25.x API exports the
// `Parser` and `Language` classes as named exports; older 0.24.x
// exposed them through a single default export (with
// `Parser.Language.load`). Use destructuring so we fail fast if
// either name is missing.
const { Parser, Language } = require('web-tree-sitter');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const WASM_PATH = path.join(REPO_ROOT, 'wasm', 'tree-sitter-mf2.wasm');
const VALID_TESTS = path.join(__dirname, 'syntax.json');
const INVALID_TESTS = path.join(__dirname, 'syntax-errors.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function main() {
  await Parser.init();
  const lang = await Language.load(WASM_PATH);
  const parser = new Parser();
  parser.setLanguage(lang);

  const valid = loadJson(VALID_TESTS);
  const invalid = loadJson(INVALID_TESTS);

  const failures = [];
  let passed = 0;
  let skipped = 0;

  function runValid(test) {
    const src = test.src;
    if (typeof src !== 'string') {
      skipped++;
      return;
    }
    const tree = parser.parse(src);
    try {
      if (tree.rootNode.hasError) {
        failures.push({
          kind: 'valid rejected',
          desc: test.description || '',
          src,
          sexp: tree.rootNode.toString(),
        });
      } else {
        passed++;
      }
    } finally {
      tree.delete();
    }
  }

  function runInvalid(test) {
    const src = test.src;
    if (typeof src !== 'string') {
      skipped++;
      return;
    }
    const tree = parser.parse(src);
    try {
      if (!tree.rootNode.hasError) {
        failures.push({
          kind: 'invalid accepted',
          desc: test.description || '',
          src,
          sexp: tree.rootNode.toString(),
        });
      } else {
        passed++;
      }
    } finally {
      tree.delete();
    }
  }

  for (const t of valid.tests) runValid(t);
  for (const t of invalid.tests) runInvalid(t);

  const total = valid.tests.length + invalid.tests.length;
  const failed = failures.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(
    `MF2 WG conformance: ${passed}/${total} (${passRate}%) · ${failed} failed${skipped ? ` · ${skipped} skipped` : ''}`
  );

  if (failures.length > 0) {
    console.error('');
    for (const f of failures.slice(0, 20)) {
      console.error(`  [${f.kind}] ${JSON.stringify(f.src)}`);
      if (f.desc) console.error(`      ${f.desc}`);
      console.error(`      tree: ${f.sexp.slice(0, 200)}${f.sexp.length > 200 ? '…' : ''}`);
    }
    if (failures.length > 20) {
      console.error(`  … and ${failures.length - 20} more failures`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('conformance runner crashed:', err);
  process.exit(2);
});
