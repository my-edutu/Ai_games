# Phase 04 Results — Mainland Morning Vertical Slice

## Decision

`VERIFIED — presentation-domain Mainland Morning vertical-slice scope`, subject to repository-wide catalogue confirmation on the closure head before merge.

## Runtime/evidence candidate

`6e48c4ece0ad17752d6dfe38f2d67780279b50d2`

Dedicated workflow:
- `Eko Run Phase 4 Mainland Morning` run `34954217787` — PASS
- Phase 4: 16/16
- Phase 3 regression: 21/21
- Phase 2 regression: 28/28
- Phase 1 regression: 20/20
- Three.js authority boundary scan: PASS
- evidence generation/upload: PASS

Evidence artifact:
- ID `10390652076`
- name `eko-run-phase4-evidence`
- digest `sha256:d4e281161e7d3b297fb4cf938b7d4f10d71bbcbbec9aec2930af2fe534a1027a`

Representative evidence:
- seed: `phase4-evidence`
- duration: 30 seconds
- 2,700 presentation models
- modes: desktop-high, desktop-medium, mobile-low-accessible
- authority checksum before/after: `73476208c1968900` / `73476208c1968900`
- authority isolation: PASS
- five-second comprehension: PASS
- critical hierarchy: PASS
- identity signals: 9
- Three scene children in evidence sample: 20
- p50: `0.004797 ms`
- p95: `0.012139 ms`
- p99: `0.026460 ms`
- worst: `0.586360 ms`
- budgets: p99 < 4 ms; worst < 16.67 ms — PASS

## TDD and three review loops

Initial vertical-slice implementation followed the committed Phase 4 plan and focused test corpus.

Review pass 1:
- RED `ffbdc2d582237393d923dea3b3f405b1e941d668`
- fixes `15c267029a71e5109d5bd273612ba849818fad7d`, `0dca9a167624d872fbcd6760a9a7ac1a597f08c8`

Review pass 2:
- RED `2baea6ae0f0b429e96b9c9c76beaee7e7910e044`
- fix `c6ebef998328852dc7544c5863976b79ad247602`

Review pass 3:
- projection RED `2a0c2d32662890e540f4f28d0c9998051e337f7b`; observed run `34953747393`
- projection fixes `a5500dae9e406f5ec2ec5e25efb1d7ec3fd7a824`, `397fec19c2d37751ef676b538080de4072bea263`, `a368c74a77bcc783e02ff6f8ba90f9dc5a37e4e5`; independent GREEN `34953873586`
- progress RED `49af2090a21146b752a8c29167c7b6efb55e8ce2`; observed run `34954045035`
- progress fix `6e48c4ece0ad17752d6dfe38f2d67780279b50d2`; final focused GREEN `34954217787`

## Non-blocking build note

Node emits Three.js CommonJS deprecation warnings because the repository currently compiles TypeScript to CommonJS. Source code already uses ES import syntax; changing the catalogue-wide module target is outside Phase 4 and is not an authority, correctness or performance failure in this candidate.

## Explicit nonclaims

Phase 4 does not claim authoritative traffic/hazard damage, final HUD/audio polish, full district catalogue, AI, audience interaction or release readiness. Those remain later-phase work.
