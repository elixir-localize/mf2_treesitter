; Foldable regions for MF2 messages.
;
; Editors that honour `@fold` captures will let the user collapse
; the matched node. For MF2 the useful fold points are:
;
;   * `matcher` — the full `.match … 1*variant` block. Collapses to
;     just the `.match` header line.
;
;   * `quoted_pattern` — a `{{ … }}` block. Useful when patterns run
;     multiple lines.
;
;   * `variant` — an individual variant inside a matcher. Lets the
;     user focus on one branch at a time.
;
; We don't fold `simple_message` (it's the whole message) or
; `placeholder` / `expression` (too small to be worth folding).

(matcher) @fold
(quoted_pattern) @fold
(variant) @fold
