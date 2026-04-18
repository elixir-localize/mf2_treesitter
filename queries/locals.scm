; Local-variable scoping for MF2.
;
; MF2 has exactly one lexical scope per complex-message: a declaration
; list at the top (`.input`, `.local`) introduces variables that are
; then referenced inside quoted patterns and matcher variants. Simple
; messages have no declarations and therefore no scope worth tracking.
;
; Each captured `@local.definition.variable` is a binding that
; `@local.reference` lookups in the same `@local.scope` can resolve.
; Editors use these captures for goto-definition, highlighting of
; unknown variables, and scope-aware rename.

; ─── Scope ───────────────────────────────────────────────────────────
(complex_message) @local.scope

; ─── Definitions ─────────────────────────────────────────────────────
;
; `.local $x = ...` — the `x` between `$` and `=` is the binding.
(local_declaration
  (variable (name) @local.definition.variable))

; `.input {$x ...}` — the `x` inside the variable-expression is the
; binding. This one is slightly odd because the binding is nested
; inside a variable_expression, but `.input` is definitional.
(input_declaration
  (variable_expression
    (variable (name) @local.definition.variable)))

; ─── References ──────────────────────────────────────────────────────
;
; Every `$x` usage in an expression is a reference. We capture the
; name so host editors can resolve it against the definitions above.
(variable (name) @local.reference)
