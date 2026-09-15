# Eko Run Requirement Traceability

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Map PRD requirements to owning phase, implementation path and falsifiable evidence.  
**Status:** `Phase 4 Mainland Morning presentation vertical slice verified; Phase 5+ open`  
**Owning scope:** All phases  
**Last material review:** 2026-09-15  
**Version:** `TRACE-1.4`

`planned` means an exact owning phase/evidence is assigned but runtime implementation is not yet verified. `phase0-verified` is documentation/research-only verification. `phase1-verified` through `phase4-verified` mean that phase-owned subset is verified while a later owning phase remains open. `verified` means the complete requirement owned by the closed phase has evidence.

| Requirement | Owning phase | Implementation path | Test/evidence | Status |
|---|---:|---|---|---|
| FR-GAME-001 shared human/AI command interface | 1/8 | `src/runtime/commands.ts`, future input/AI adapters | Phase 1 results + Phase 8 AI benchmark | phase1-verified; Phase 8 open |
| FR-GAME-002 distance/checkpoint primary progress | 1/6 | `src/state`, `src/rules`, later HUD | Phase 1 evidence + Phase 4 visible progress beacon + Phase 6/7 captures | phase4-verified presentation subset; Phase 6 open |
| FR-GAME-003 full precision controller | 2 | `src/physics`, movement rules | Phase 2 movement/collision/recovery/render-schedule suites | verified |
| FR-GAME-004 hazard warning/response fairness | 4/5 | presentation cues + Phase 5 hazard contracts/rules | Phase 4 cue integrity + Phase 5 fairness corpus | phase4-verified presentation-cue subset; Phase 5 authority open |
| FR-GAME-005 four equal-collision outfit families | 3 | `src/presentation/character` | Phase 3 21-test suite, deterministic preview evidence, 3 review passes | verified |
| FR-GAME-006 checkpoint/result/intermission/restart | 2/6 | rules/runtime/presentation | Phase 2 failure/restart regressions + Phase 6 result/intermission evidence | phase2-verified failure/restart subset; Phase 6 open |
| FR-GAME-007 AI uses same rules | 8 | `src/ai` → command interface | identical-rule/replay benchmarks | planned |
| FR-GAME-008 valid generated backbone | 6 | `src/generation` | property/seed validity corpus | planned |
| FR-GAME-009 bounded cosmetic-focused economy | 6 | resources/economy contracts | economy simulation/exploit tests | planned |
| FR-GAME-010 moderated replayable viewer influence | 9 | `src/influence` + external adapter | idempotency/moderation/provider tests | planned |
| FR-GAME-011 six differentiated districts | 4/10 | `src/presentation/world`, later district packs/generation | Phase 4 Mainland Morning + Phase 10 district review | phase4-verified Mainland Morning subset; Phase 10 expansion open |
| FR-GAME-012 technical failure not game loss | 12 | supervisor/operations | chaos/recovery evidence | planned |
| NFR-DET-001 fixed 60 Hz authority | 1 | config/runtime | Phase 1–4 regressions | verified |
| NFR-DET-002 named seeded randomness only | 1 | `src/runtime/prng.ts` | random-stream isolation + nondeterminism scans | verified |
| NFR-DET-003 identical-input checksums | 1 | checksum/replay | repeat/replay/headless checksums | verified |
| NFR-ARCH-001 presentation/external cannot mutate authority | 1/3/4 | module boundaries + character/world projection | Phase 3 authority checksum + Phase 4 Three boundary scan/evidence | verified for current presentation scope |
| NFR-ARCH-002 serializable versioned contracts | 1 | state/command/event/snapshot types | restore/version tests | verified |
| NFR-PERF-001 authoritative p99/worst budgets | 1/2 | simulation/headless runners | Phase 1/2 evidence | verified for current authority scope |
| NFR-PERF-002 degradation preserves critical info | 4/11 | presentation quality tiers | Phase 4 low-tier hierarchy/accessibility tests + later large-scene evidence | phase4-verified vertical-slice subset; Phase 11 open |
| NFR-UX-001 five-second comprehension | 4 | camera/world/progress presentation | Phase 4 main/review-pass3 tests + evidence runner | verified for Mainland Morning vertical slice |
| NFR-UX-002 stop-ship overrides score | all | `AGENTS.md`, experience standard | phase review records | phase0-verified; enforced through Phase 4 |
| NFR-ACC-001 multimodal/reduced-motion critical cues | 3/4/7/11 | character pose + world cues + AV/HUD/audio | Phase 3 reduced-motion poses + Phase 4 muted/reduced-motion cue tests | phase4-verified vertical-slice subset; final multimodal work open |
| NFR-SEC-001 sensitive data excluded from authority/public output | 1/3/9 | architecture/presentation/provider boundaries | public snapshot + provider/nondeterminism scans | phase3-verified presentation subset; Phase 9 open |
| NFR-ASSET-001 asset provenance and rights review | 0/all | `ASSET_LEDGER.md` | ledger/static review + release asset audit | phase0-verified for current references; continuous |
| NFR-REL-001 validated snapshot/renderer reconstruction | 1/3/12 | persistence + presentation reconstruction | restore tests + Phase 3 JSON restart + Phase 4 snapshot-only world reconstruction | phase4-verified presentation reconstruction; Phase 12 recovery open |
| NFR-REL-002 optional services cannot stop autonomous truth | 8/9/12 | policy/fallback/supervisor | outage/chaos tests | planned |

## Phase 1 Traceability Gate

The deterministic foundation remains verified by `evidence/eko-run/phase1/PHASE-01-RESULTS.md` and its exact-candidate workflows.

## Phase 2 Traceability Gate

The precision-movement graybox remains verified by `evidence/eko-run/phase2/PHASE-02-RESULTS.md`, its three adversarial reviews and exact-candidate CI/evidence.

## Phase 3 Traceability Gate

Candidate `3fc5de87942b0b045065af86132d613fae44fecc` remains verified by Phase 3 results, three reviews, dedicated run `34946027452`, full catalogue run `34946027458` and artifact `10387805177`.

Phase 3 closed `FR-GAME-005` and character-specific reduced-motion/reconstruction subsets.

## Phase 4 Traceability Gate

Runtime/evidence candidate `6e48c4ece0ad17752d6dfe38f2d67780279b50d2` is verified by:

- `evidence/eko-run/phase4/PHASE-04-RESULTS.md`;
- `evidence/eko-run/phase4/PHASE-04-EXPERIENCE-REVIEW.md`;
- three review passes under `evidence/eko-run/phase4/`;
- dedicated workflow run `34954217787`;
- evidence artifact `10390652076`, digest `sha256:d4e281161e7d3b297fb4cf938b7d4f10d71bbcbbec9aec2930af2fe534a1027a`;
- unchanged authority checksum `73476208c1968900` across 2,700 presentation-model samples;
- p99 `0.026460 ms`, worst `0.586360 ms`.

Phase 4 verifies the Mainland Morning subset of district identity, five-second vertical-slice comprehension, presentation cue integrity, low-tier critical-information preservation, portrait/desktop camera equivalence and world-presentation authority isolation. Authoritative hazard fairness/traffic remains Phase 5 work; district expansion, final HUD/audio, AI, viewer interaction and production readiness remain open.
