// Type declarations for the Node.js binding of tree-sitter-mf2.
//
// These types match the shape expected by node-tree-sitter.
// web-tree-sitter users don't consume this file — they load the
// .wasm directly.

type BaseLanguage = {
  name: string;
  language: unknown;
  nodeTypeInfo?: Array<{
    type: string;
    named: boolean;
    fields?: Record<string, unknown>;
    children?: unknown;
    subtypes?: Array<{ type: string; named: boolean }>;
  }>;
};

declare const binding: BaseLanguage;

export = binding;
