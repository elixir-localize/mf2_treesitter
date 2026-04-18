; Language-injection rules for MF2 content.
;
; This file is intentionally minimal. MF2 messages are self-contained
; — they don't generally embed other languages. The two places where
; an injection *could* make sense are:
;
;   * `quoted_literal` values — but their interpretation depends
;     entirely on the enclosing `function`. `:number` expects a
;     number-format skeleton; `:datetime` expects a date-time
;     skeleton; user-defined functions have their own conventions.
;     Without a registry lookup we can't know which language to
;     inject.
;
;   * `text` nodes inside patterns — these are free-form localised
;     text. Could be HTML, plain text, or markup. Again, can't know.
;
; Instead, language-specific injections live in downstream packages
; that know the host context. For Elixir's `~M` sigil injection
; (MF2 inside Elixir source), see
; `mf2_editor_extensions/queries/elixir-injections.scm`.
;
; This file is present (rather than absent) so that editors that
; expect `queries/injections.scm` to exist don't error on its
; absence.
