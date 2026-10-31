# Phase 6 Review Pass 3 — Generated-Content Tamper Resistance

Status: `CLOSED`

## Attack

Review Pass 3 challenged the strongest integrity assumption in Phase 6: whether generated content could be mutated after generation while retaining stale `valid` metadata or a stale fingerprint and still enter live authority, snapshots or replay.

RED attack commit: `5551d5ca7e1b33e6729c7c72ac67c2eb50cf9fcf`.

## Findings

1. Authoritative invariants trusted the stored validation result rather than independently revalidating generated constraints.
2. Active generated content could be mutated behind a stale fingerprint without immediate invariant rejection.
3. Snapshot creation inherited that weakness because the mutated state could still pass its pre-snapshot invariant check.
4. The deterministic fingerprint function was internal-only, preventing direct campaign-level integrity verification.

These were stop-ship integrity findings because a replay/snapshot could otherwise carry outcome-relevant generated content whose provenance metadata still claimed it was valid.

## Improvements

- Exposed a deterministic `fingerprintGeneratedDistrict` function for verification.
- Recompute the active generated-content fingerprint at the authoritative invariant boundary.
- Independently rerun hard generated-content validation at the authoritative invariant boundary.
- Reject stale fingerprints even when stored validation metadata still says `valid: true`.
- Reject invalid generated content even if an attacker recomputes and supplies a matching new fingerprint.
- Because snapshot creation validates authoritative state first, tampered generated content now fails closed before persistence.

GREEN head: `7a875e0a50b69e63aad94329720dd07d369b6230`.

## Re-review

All 31 Phase 6 tests passed after the fix, including stale-fingerprint rejection, independent hard validation, snapshot fail-closed behavior and a seed campaign proving fresh fingerprints remain stable. Phase 1–5 regressions and the authority scan also passed. No unresolved Review Pass 3 stop-ship/P1/P2 finding remained.
