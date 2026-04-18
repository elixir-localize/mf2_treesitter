// Node.js binding for the MF2 tree-sitter grammar.
//
// Follows the standard tree-sitter grammar binding pattern: a small
// native module that exposes the generated `tree_sitter_mf2()` C
// function as a JS-accessible object. The consumer is typically
// node-tree-sitter (for server-side JS parsing) or web-tree-sitter
// (which doesn't use this — it loads the .wasm directly).

#include <napi.h>

typedef struct TSLanguage TSLanguage;

extern "C" TSLanguage *tree_sitter_mf2();

// Each grammar binding carries a unique 128-bit "type tag" so that
// consumers can verify they're receiving the expected language
// object. This tag is specific to MF2 — don't copy it to another
// grammar's binding.
static const napi_type_tag LANGUAGE_TYPE_TAG = {
  0x8AF2E5E7CD5E4A3CULL, 0x9DDE548A7C1F7A7FULL
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["name"] = Napi::String::New(env, "mf2");
  auto language = Napi::External<TSLanguage>::New(env, tree_sitter_mf2());
  language.TypeTag(&LANGUAGE_TYPE_TAG);
  exports["language"] = language;
  return exports;
}

NODE_API_MODULE(tree_sitter_mf2_binding, Init)
