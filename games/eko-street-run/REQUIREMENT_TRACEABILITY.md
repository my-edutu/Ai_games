# Eko Run Requirement Traceability

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Map PRD requirements to owning phase, implementation path and falsifiable evidence.  
**Status:** `Phase 6 progression, procedural generation and economy verified; Phase 7+ open`  
**Owning scope:** All phases  
**Last material review:** 2026-09-16  
**Version:** `TRACE-1.6`

`planned` means an exact owning phase/evidence is assigned but runtime implementation is not yet verified. `phaseN-verified` means the phase-owned subset is verified while a later owning phase remains open. `verified` means the complete requirement owned by the closed phase has evidence.

| Requirement | Owning phase | Implementation path | Test/evidence | Status |
|---|---:|---|---|---|
| FR-GAME-001 shared human/AI command interface | 1/8 | `src/runtime/commands.ts`, future AI adapter | Phase 1 results + Phase 8 AI benchmark | phase1-verified; Phase 8 open |
| FR-GAME-002 distance/checkpoint primary progress | 1/6/7 | `src/state`, `src/rules`, `src/progression`, later final HUD | Phase 1 evidence + Phase 4 visible progress + Phase 6 progression evidence + Phase 7 HUD evidence | phase6-verified authority/progression; Phase 7 presentation open |
| FR-GAME-003 full precision controller | 2 | `src/physics`, movement rules | Phase 2 movement/collision/recovery/render-schedule suites | verified |
| FR-GAME-004 hazard warning/response fairness | 4/5 | presentation cues + hazard contracts/rules | Phase 4 cue integrity + Phase 5 fairness corpus | verified for Phase 5 authority/presentation scope |
| FR-GAME-005 four equal-collision outfit families | 3 | `src/presentation/character` | Phase 3 21-test suite, deterministic preview evidence, 3 review passes | verified |
| FR-GAME-006 checkpoint/result/intermission/restart | 2/6 | rules/runtime/progression/presentation | Phase 2 failure/restart + Phase 6 intermission/advance/wrap/snapshot evidence | verified |
| FR-GAME-007 AI uses same rules | 8 | `src/ai` → command interface | identical-rule/replay benchmarks | planned |
| FR-GAME-008 valid generated backbone | 6 | `src/generation` | Phase 6 31-test suite + 432-sample evidence campaign + 3 reviews | verified |
| FR-GAME-009 bounded cosmetic-focused economy | 6 | `src/progression` / resource contracts | token idempotency, audit bounds, cosmetic-neutral movement tests | verified |
| FR-GAME-010 moderated replayable viewer influence | 9 | `src/influence` + external adapter | idempotency/moderation/provider tests | planned |
| FR-GAME-011 six differentiated districts | 4/6/10 | `src/presentation/world`, `src/generation`, later district packs | Phase 4 Mainland Morning + Phase 6 six-district authority + Phase 10 presentation review | phase6-verified authority ladder; Phase 10 presentation expansion open |
| FR-GAME-012 technical failure not game loss | 12 | supervisor/operations | chaos/recovery evidence | planned |
| NFR-DET-001 fixed 60 Hz authority | 1 | config/runtime | Phase 1–6 regression suites | verified |
| NFR-DET-002 named seeded randomness only | 1/6 | `src/runtime/prng.ts`, generated seed derivation | random-stream isolation + nondeterminism scans + Phase 6 repeat fingerprints | verified |
| NFR-DET-003 identical-input checksums | 1/6 | checksum/replay/progression | repeat/replay/headless + Phase 6 snapshot/advance checksum evidence | verified |
| NFR-ARCH-001 presentation/external cannot mutate authority | 1/3/4 | module boundaries + character/world projection | Phase 3 checksum + Phase 4 Three boundary scan + Phase 1–6 authority scans | verified for current presentation scope |
| NFR-ARCH-002 serializable versioned contracts | 1/6 | state/command/event/snapshot/generated provenance | restore/version/provenance tests | verified |
| NFR-PERF-001 authoritative p99/worst budgets | 1/2/5/6 | simulation/evidence runners | Phase 1/2/5/6 performance evidence | verified for current authority scope |
| NFR-PERF-002 degradation preserves critical info | 4/7/11 | presentation quality tiers | Phase 4 low-tier hierarchy + Phase 7 final presentation + Phase 11 device evidence | phase4-verified vertical-slice subset; Phase 7/11 open |
| NFR-UX-001 five-second comprehension | 4/7 | camera/world/progress/final HUD | Phase 4 tests/evidence + Phase 7 final HUD evidence | phase4-verified vertical slice; Phase 7 finalization open |
| NFR-UX-002 stop-ship overrides score | all | `AGENTS.md`, experience standard, review records | phase review records | enforced through Phase 6 |
| NFR-ACC-001 multimodal/reduced-motion critical cues | 3/4/7/11 | character pose + world cues + HUD/audio/VFX | Phase 3 reduced-motion + Phase 4 muted/reduced-motion + later Phase 7/11 evidence | phase4-verified vertical-slice subset; Phase 7/11 open |
| NFR-SEC-001 sensitive data excluded from authority/public output | 1/3/6/9 | architecture/presentation/progression/provider boundaries | public snapshot + provider/nondeterminism scans + Phase 6 seed privacy test | phase6-verified current scope; Phase 9 provider scope open |
| NFR-ASSET-001 asset provenance and rights review | 0/all | `ASSET_LEDGER.md` | ledger/static review + release asset audit | phase0-verified for current references; continuous |
| NFR-REL-001 validated snapshot/renderer reconstruction | 1/3/4/6/12 | persistence + presentation + progression reconstruction | restore tests + Phase 3 JSON restart + Phase 4 reconstruction + Phase 6 snapshot/advance | phase6-verified current reconstruction; Phase 12 recovery open |
| NFR-REL-002 optional services cannot stop autonomous truth | 8/9/12 | policy/fallback/supervisor | outage/chaos tests | planned |

## Phase 1 Traceability Gate

The deterministic foundation remains verified by `evidence/eko-run/phase1/PHASE-01-RESULTS.md` and its exact-candidate workflows.

## Phase 2 Traceability Gate

The precision-movement graybox remains verified by `evidence/eko-run/phase2/PHASE-02-RESULTS.md`, its three adversarial reviews and exact-candidate CI/evidence.

## Phase 3 Traceability Gate

Candidate `3fc5de87942b0b045065af86132d613fae44fecc` remains verified by Phase 3 results, three reviews, dedicated run `34946027452`, full catalogue run `34946027458` and artifact `10387805177`.

Phase 3 closed `FR-GAME-005` and character-specific reduced-motion/reconstruction subsets.

## Phase 4 Traceability Gate

Runtime/evidence candidate `6e48c4ece0ad17752d6dfe38f2d67780279b50d2` remains verified by its Phase 4 result/experience/review records, dedicated workflow `34954217787`, evidence artifact `10390652076`, unchanged authority checksum across 2,700 presentation samples, and measured p99/worst presentation-model timing.

Phase 4 verifies the Mainland Morning presentation slice and five-second comprehension subset while later final presentation work remains open.

## Phase 5 Traceability Gate

Runtime/evidence candidate `5b690ffcf8524b5ef13fe7d9e23dfb3d3dc8b137` is verified by:

- `evidence/eko-run/phase5/PHASE-05-RESULTS.md`;
- three adversarial Phase 5 review records;
- focused/evidence run `34960558328`;
- full catalogue run `34960558350`;
- evidence artifact `10393201489`, digest `sha256:bb722f9861ee59643f384ca9a00d0ff0f9426801f004f94e0a163f1a485fcafe`;
- deterministic checksum `0447bb019fe27069` repeated exactly;
- minimum independent hazard gap `5.30 m` against `3.50 m` requirement;
- p99 `0.667475 ms`, worst `3.387356 ms`.

Phase 5 closes the authoritative hazard/traffic fairness subset while progression/generation remained Phase 6 work.

## Phase 6 Traceability Gate

Runtime/evidence candidate `8d418a4db51acdb094c8b7a20fd1377993400a33` is verified by:

- `games/eko-street-run/phases/PHASE-06-PROGRESSION-GENERATION.md`;
- `evidence/eko-run/phase6/PHASE-06-RESULTS.md`;
- `evidence/eko-run/phase6/PHASE-06-EXPERIENCE-REVIEW.md`;
- three adversarial review records under `evidence/eko-run/phase6/`;
- dedicated workflow run `34977420628`;
- full catalogue run `34977420658`;
- evidence artifact `10400340261`, digest `sha256:093a82cd316453fc89c30348da1e0501a41bee4f6c06b8832b793f843ad49001`;
- 31/31 Phase 6 tests plus Phase 1–5 regressions and authority scan;
- 432/432 valid generated samples and 432 unique fingerprints;
- direct/restored snapshot-advance checksum `8cf7d8f4df25a153`;
- minimum physical response margin `1.5 m`;
- generation p99 `0.298250 ms`, worst `1.363977 ms`;
- simulation p99 `1.179761 ms`, worst `1.577006 ms`.

Phase 6 closes `FR-GAME-008`, `FR-GAME-009` and the Phase 6-owned portion of `FR-GAME-006`, and verifies the authoritative progression portion of `FR-GAME-002`/`FR-GAME-011`. Final HUD/audio/VFX/game-feel presentation remains Phase 7 work; AI, viewer interaction and production-readiness scopes remain later phases.
