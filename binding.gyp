{
  "targets": [
    {
      "target_name": "tree_sitter_mf2_binding",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except"
      ],
      "include_dirs": [
        "src"
      ],
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c"
      ],
      "cflags_c": [
        "-std=c11"
      ],
      "cflags_cc": [
        "-std=c++17"
      ],
      "conditions": [
        ["OS!='win'", {
          "cflags_c": [ "-Wno-unused-but-set-variable" ]
        }]
      ]
    }
  ]
}
