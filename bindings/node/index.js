// Entry point for `require('tree-sitter-mf2')`.
//
// Uses node-gyp-build to select a prebuilt native binary for the
// current platform from `prebuilds/`, falling back to building from
// source (via node-gyp + binding.gyp) if no match is found. The
// resulting object has the shape:
//
//   {
//     name: 'mf2',
//     language: <TSLanguage *>   // opaque Napi::External
//   }
//
// Pass `language` to node-tree-sitter's `Parser.prototype.setLanguage`.

const binding = require("node-gyp-build")(__dirname + "/../..");

try {
  binding.nodeTypeInfo = require("../../src/node-types.json");
} catch (_) {
  // node-types.json missing during development — tolerate.
}

module.exports = binding;
