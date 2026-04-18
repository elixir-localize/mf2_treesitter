; Symbol tags for MF2 messages.
;
; Used by editor "outline" views, ctags-style jump-to-definition,
; and the Github "Go to definition" code-intelligence feature. Each
; `@definition.*` capture produces an entry in the file's symbol
; index.
;
; In MF2 the only things worth indexing as symbols are the named
; bindings introduced by `.input` and `.local` declarations at the
; top of a complex message. Those are the "definitions" a reader
; might want to jump to; nothing else in the grammar introduces
; named entities.

; ─── .local $x = … ─────────────────────────────────────────────────
(local_declaration
  (variable (name) @name)) @definition.variable

; ─── .input {$x …} ─────────────────────────────────────────────────
(input_declaration
  (variable_expression
    (variable (name) @name))) @definition.variable
