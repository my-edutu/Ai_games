# Phase 5 Review Pass 3 — Restart Persistence

Finding: checkpoint restart could preserve a future hazard as already hit/resolved. The first repair exposed a second issue: reset hazards could immediately re-enter `warned` on the restart tick itself.

Observed RED: the dedicated restart-persistence regression failed first on retained encounter state, then again because the reset encounter advanced during the same restart tick.

Improvement: restart now preserves only hazards whose full motion envelope is behind the checkpoint, resets checkpoint/future encounters to fresh state, and defers hazard evaluation until the next authoritative tick after restart.

Verification: final exact-head focused run `34960558328` passes the Review-3 regression with all Phase 1–4 regressions green. Full catalogue run `34960558350` also passes.

Verdict: PASS. No unresolved stop-ship/P1/P2 restart-persistence finding.
