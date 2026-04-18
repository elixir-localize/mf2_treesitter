#!/usr/bin/env node

// Refresh the vendored MF2 WG syntax-conformance test files from
// upstream (`unicode-org/message-format-wg`).
//
// Mirrors the `mix localize.update_mf2_conformance` task on the
// Elixir side — same upstream, same files, same check mode, so a
// single upstream change triggers an identical refresh across both
// parsers.
//
// Usage:
//   node scripts/update-conformance.mjs              # fetch + write
//   node scripts/update-conformance.mjs --check      # CI mode, exits 1 on drift
//   node scripts/update-conformance.mjs --ref v46    # pin to a tag/branch/sha
//
// The task prints a short summary of what changed (file name and
// before/after test counts) so a drift is obvious at a glance.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetDir = path.resolve(__dirname, "..", "test", "conformance");

const UPSTREAM = "unicode-org/message-format-wg";
const DEFAULT_REF = "main";
const FILES = [
  { name: "syntax.json", upstreamPath: "test/tests/syntax.json" },
  { name: "syntax-errors.json", upstreamPath: "test/tests/syntax-errors.json" },
];

const args = parseArgs(process.argv.slice(2));
const ref = args.ref ?? DEFAULT_REF;

console.log(`MF2 conformance suite ← ${UPSTREAM}@${ref}`);

const results = await Promise.all(
  FILES.map((f) => syncFile(f, ref, args.check))
);

const changed = results.filter((r) => r.status === "changed");
const missing = results.filter((r) => r.status === "missing");

if (missing.length) {
  for (const r of missing) console.error(`  ✗ ${r.reason}`);
  process.exit(1);
}

if (changed.length === 0) {
  console.log("  ✓ already in sync");
  process.exit(0);
}

if (args.check) {
  for (const r of changed) {
    console.error(
      `  ✗ ${r.name} has drifted (local: ${r.before} tests, upstream: ${r.after})`
    );
  }
  console.error("");
  console.error("Run `npm run conformance:update` to sync, then commit.");
  process.exit(1);
}

for (const r of changed) {
  console.log(`  ✓ ${r.name}: ${r.before} → ${r.after} cases`);
}
console.log("");
console.log("Next: run the conformance runner to check for regressions:");
console.log("    npm run test:conformance");

async function syncFile({ name, upstreamPath }, ref, checkOnly) {
  const url =
    `https://raw.githubusercontent.com/${UPSTREAM}/${ref}/${upstreamPath}`;
  const localPath = path.join(targetDir, name);

  let upstreamBody;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { status: "missing", reason: `${name}: HTTP ${res.status} ${res.statusText}` };
    }
    upstreamBody = await res.text();
  } catch (err) {
    return { status: "missing", reason: `${name}: ${err.message}` };
  }

  if (!isValidSuite(upstreamBody)) {
    return {
      status: "missing",
      reason: `${name} is not a valid MF2 WG test file (no "tests" array)`,
    };
  }

  let localBody = "";
  try {
    localBody = await fs.readFile(localPath, "utf8");
  } catch (_) {
    // missing locally is treated as changed
  }

  if (localBody === upstreamBody) {
    return { status: "ok", name };
  }

  if (!checkOnly) {
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(localPath, upstreamBody);
  }

  return {
    status: "changed",
    name,
    before: testCount(localBody),
    after: testCount(upstreamBody),
  };
}

function isValidSuite(body) {
  try {
    const d = JSON.parse(body);
    return Array.isArray(d?.tests);
  } catch {
    return false;
  }
}

function testCount(body) {
  if (!body) return 0;
  try {
    const d = JSON.parse(body);
    return Array.isArray(d?.tests) ? d.tests.length : "?";
  } catch {
    return "?";
  }
}

function parseArgs(argv) {
  const out = { check: false, ref: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--check") out.check = true;
    else if (argv[i] === "--ref") out.ref = argv[++i];
    else if (argv[i].startsWith("--ref=")) out.ref = argv[i].slice("--ref=".length);
    else {
      console.error(`Unknown argument: ${argv[i]}`);
      process.exit(1);
    }
  }
  return out;
}
