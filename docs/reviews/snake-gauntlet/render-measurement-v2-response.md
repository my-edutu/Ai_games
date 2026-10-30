# Renderer diagnostic v2 — review response

The independent measurement critic reviewed the corrected test and found no remaining runtime measurement blocker before isolated CI. The production renderer and pacing gate are unchanged.

The corrected test uses WebGL2 fences with asynchronous clientWaitSync polling, explicit timeout/context-loss/error handling and guaranteed sync deletion. Actual drawing pauses only outside the cadence samples. Query results remain owned until complete, invalidated or explicitly incomplete; fallback fenced wall-time probes are separate from the cadence and query-collection interval.

Seven sequential conditions compare live startup, the same live context after a fence, that context frozen on its last successful renderer draw, fresh fixed-low full app, matched minimal canvas, and two dynamic-draw omissions. Fixed-low construction locks adaptation, and every non-startup sample asserts a stable cache. Omission modes restore visibility; a missing water mesh fails explicitly. Sequential comparisons retain elapsed-time and live-state limitations and are not a randomized speedup claim.

The reviewer found one final provenance mismatch: hashing frameText while writing a trailing newline. Root corrected the writer to save exactly frameText, so the saved snapshot artifact and its SHA-256 use identical bytes. The builder also corrected last-frame provenance to update only after a successful actual draw and records query-collection duration before fallback probes.

Node-only verification covers syntax and generated-module source anchors, minimal-page syntax, asynchronous fence completion, failed waits, timeout cleanup and context loss. Playwright lists the thirteen expected focused browser checks. Runtime GPU correctness and the next performance decision remain pending isolated CI.
