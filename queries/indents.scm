; Auto-indent rules for MF2 messages.
;
; These follow the nvim-treesitter `indents.scm` convention — nodes
; captured with `@indent.begin` increment the indent level for the
; next line; `@indent.end` decrements; `@indent.align` keeps the
; indent at a specific column. Most tree-sitter hosts consume the
; same captures.
;
; MF2 is not a whitespace-sensitive language in the usual sense —
; patterns and expressions are defined by delimiters, not indent —
; but there are a few places where auto-indent is a QoL win:
;
;   * Inside `{{ … }}` quoted-patterns, continuation lines align.
;   * `.match` variants align at the column the first variant started.
;
; Editors without indent awareness fall back to plain "copy previous
; line's indent" behaviour. These captures are a nicety.

; ─── Increment after an opening delimiter ────────────────────────────

[
  (quoted_pattern)
  (matcher)
] @indent.begin

; ─── Decrement at the closing delimiter ──────────────────────────────

"}}" @indent.end

; ─── Variants in a matcher share the matcher's column ────────────────

(variant) @indent.align
