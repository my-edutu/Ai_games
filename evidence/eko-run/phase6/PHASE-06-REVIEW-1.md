# Phase 6 Review Pass 1 — Provenance and Progression Integrity

Status: `CLOSED`

## Attack

Review Pass 1 challenged whether generated content could remain authoritative after district/cycle drift, whether the generator proved which version/district/cycle created a route, and whether repeated districts in endless mode could collide in reward identity.

RED attack commit: `b97c88e3c1c68cff207f8e837add16489669e7af`.

## Findings

1. Generated content lacked explicit generator/district/cycle provenance.
2. State invariants did not independently reject district-index/id/content disagreement.
3. State invariants did not reject cycle/content disagreement.
4. Reward-token identity needed to remain distinct when the same district reappeared in a later cycle.

These were integrity findings, not presentation issues. Allowing provenance drift would make replay/snapshot claims ambiguous and could make a later endless cycle reuse earlier reward identity.

## Improvements

- Added explicit generated-content provenance: generator version, district index, district id and cycle.
- Bound active generated content to authoritative progression state and route identity.
- Added fail-closed progression provenance invariants.
- Included provenance in the authoritative checksum.
- Preserved actual cycle provenance through repair/fallback generation.
- Made token IDs cycle-distinct for repeated districts.

GREEN head: `5e3e7219542082971117ea36dee5860231077dbd`.

## Re-review

The focused Phase 6 suite, all Phase 1–5 regressions and authority scan passed after the improvements. No unresolved Review Pass 1 stop-ship/P1/P2 finding remained.
