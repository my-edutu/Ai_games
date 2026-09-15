# Eko Run Requirement Traceability

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Map PRD requirements to owning phase, implementation path and falsifiable evidence.  
**Status:** `Phase 3 character/outfit/animation presentation verified; later phases open`  
**Owning scope:** All phases  
**Last material review:** 2026-09-15  
**Version:** `TRACE-1.3`

`planned` means an exact owning phase/evidence is assigned but runtime implementation is not yet verified. `phase0-verified` is documentation/research-only verification. `phase1-verified`, `phase2-verified` and `phase3-verified` mean that phase-owned subset is verified while a later owning phase remains open. `verified` means the complete requirement owned by the closed phase has evidence.

| Requirement | Owning phase | Implementation path | Test/evidence | Status |
|---|---:|---|---|---|
| FR-GAME-001 shared human/AI command interface | 1/8 | `src/runtime/commands.ts`, future input/AI adapters | Phase 1 results + Phase 8 AI benchmark | phase1-verified; Phase 8 open |
| FR-GAME-002 distance/checkpoint primary progress | 1/6 | `src/state`, `src/rules`, later HUD | Phase 1 evidence + Phase 6/7 captures | phase1-verified foundation; Phase 6 open |
| FR-GAME-003 full precision controller | 2 | `src/physics`, movement rules | Phase 2 movement/collision/recovery/render-schedule suites | verified |
| FR-GAME-004 hazard warning/response fairness | 4/5 | hazard contracts + rules | vertical-slice/hazard fairness corpus | planned |
| FR-GAME-005 four equal-collision outfit families | 3 | `src/presentation/character` | Phase 3 21-test suite, deterministic preview evidence, 3 review passes | verified |
| FR-GAME-006 checkpoint/result/intermission/restart | 2/6 | rules/runtime/presentation | Phase 2 failure/restart regressions + Phase 6 result/intermission evidence | phase2-verified failure/restart subset; Phase 6 open |
| FR-GAME-007 AI uses same rules | 8 | `src/ai` → command interface | identical-rule/replay benchmarks | planned |
| FR-GAME-008 valid generated backbone | 6 | `src/generation` | property/seed validity corpus | planned |
| FR-GAME-009 bounded cosmetic-focused economy | 6 | resources/economy contracts | economy simulation/exploit tests | planned |
| FR-GAME-010 moderated replayable viewer influence | 9 | `src/influence` + external adapter | idempotency/moderation/provider tests | planned |
| FR-GAME-011 six differentiated districts | 4/10 | content packs/presentation/generation | Phase 4 Mainland Morning + Phase 10 district review | planned |
| FR-GAME-012 technical failure not game loss | 12 | supervisor/operations | chaos/recovery evidence | planned |
| NFR-DET-001 fixed 60 Hz authority | 1 | config/runtime | Phase 1–3 regressions | verified |
| NFR-DET-002 named seeded randomness only | 1 | `src/runtime/prng.ts` | random-stream isolation + nondeterminism scans | verified |
| NFR-DET-003 identical-input checksums | 1 | checksum/replay | repeat/replay/headless checksums | verified |
| NFR-ARCH-001 presentation/external cannot mutate authority | 1/3 | module boundaries + character projection | Phase 3 authority checksum before/after presentation | verified |
| NFR-ARCH-002 serializable versioned contracts | 1 | state/command/event/snapshot types | restore/version tests | verified |
| NFR-PERF-001 authoritative p99/worst budgets | 1/2 | simulation/headless runners | Phase 1/2 evidence | verified for current authority scope |
| NFR-PERF-002 degradation preserves critical info | 4/11 | presentation quality tiers | low-tier captures/perf evidence | planned |
| NFR-UX-001 five-second comprehension | 4 | camera/level/HUD | vertical-slice review | planned |
| NFR-UX-002 stop-ship overrides score | all | `AGENTS.md`, experience standard | phase review records | phase0-verified; enforced through Phase 3 |
| NFR-ACC-001 multimodal/reduced-motion critical cues | 3/4/7/11 | character pose + AV/HUD/audio | Phase 3 reduced-motion pose tests + later accessibility evidence | phase3-verified motion/silhouette subset; later multimodal work open |
| NFR-SEC-001 sensitive data excluded from authority/public output | 1/3/9 | architecture/presentation/provider boundaries | Phase 1 public snapshot + Phase 3 provider/nondeterminism scan | phase3-verified presentation subset; Phase 9 open |
| NFR-ASSET-001 asset provenance and rights review | 0/all | `ASSET_LEDGER.md` | ledger/static review + release asset audit | phase0-verified for current references; continuous |
| NFR-REL-001 validated snapshot/renderer reconstruction | 1/3/12 | persistence + presentation reconstruction | restore tests + Phase 3 JSON restart equivalence | phase3-verified renderer reconstruction; Phase 12 recovery open |
| NFR-REL-002 optional services cannot stop autonomous truth | 8/9/12 | policy/fallback/supervisor | outage/chaos tests | planned |

## Phase 1 Traceability Gate

The deterministic foundation remains verified by `evidence/eko-run/phase1/PHASE-01-RESULTS.md` and its exact-candidate workflows.

## Phase 2 Traceability Gate

The precision-movement graybox remains verified by `evidence/eko-run/phase2/PHASE-02-RESULTS.md`, its three adversarial reviews and exact-candidate CI/evidence.

## Phase 3 Traceability Gate

Candidate `3fc5de87942b0b045065af86132d613fae44fecc` is verified by:

- `evidence/eko-run/phase3/PHASE-03-RESULTS.md`;
- `evidence/eko-run/phase3/PHASE-03-EXPERIENCE-REVIEW.md`;
- review passes 1–3 under `evidence/eko-run/phase3/`;
- dedicated workflow run `34946027452`;
- full catalogue workflow run `34946027458`;
- artifact `10387805177`, digest `sha256:a02b5dd5f355ca2060c382fef908ad837d9b590aed1daa5e394872c620b6f9bf`.

Phase 3 closes `FR-GAME-005`, strengthens the verified presentation-isolation contract, and verifies the character-specific reduced-motion/reconstruction subsets. Mainland Morning environment/camera/audio, hazard fairness, traffic, final accessibility, AI, viewer interaction and production readiness remain open.