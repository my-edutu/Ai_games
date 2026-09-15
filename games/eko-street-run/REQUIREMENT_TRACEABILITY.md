# Eko Run Requirement Traceability

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Map PRD requirements to owning phase, implementation path and falsifiable evidence.  
**Status:** `Phase 2 deterministic precision movement verified; later phases open`  
**Owning scope:** All phases  
**Last material review:** 2026-09-15  
**Version:** `TRACE-1.2`

`planned` means an exact owning phase/evidence is assigned but runtime implementation is not yet verified. `phase0-verified` is reserved for documentation/research-only requirements. `phase1-verified` means the Phase 1-owned subset is verified while a later owning phase remains open. `phase2-verified` means the Phase 2-owned subset is verified while a later owning phase remains open. `verified` means the complete requirement owned by the closed phase has runtime evidence.

| Requirement | Owning phase | Implementation path | Test/evidence | Status |
|---|---:|---|---|---|
| FR-GAME-001 shared human/AI command interface | 1/8 | `src/runtime/commands.ts`, future input/AI adapters | `eko-run-commands.test.cjs`, Phase 1 results, Phase 8 AI benchmark | phase1-verified; Phase 8 open |
| FR-GAME-002 distance/checkpoint primary progress | 1/6 | `src/state`, `src/rules`, later HUD | state/determinism/headless tests + Phase 6/7 captures | phase1-verified foundation; Phase 6 open |
| FR-GAME-003 full precision controller | 2 | `src/physics`, movement rules | Phase 2 movement/collision/recovery/render-schedule suites + Phase 2 results | verified |
| FR-GAME-004 hazard warning/response fairness | 4/5 | hazard contracts + rules | hazard fairness corpus/replay | planned |
| FR-GAME-005 four equal-collision outfit families | 3 | presentation character/costume | silhouette/collision regression evidence | planned |
| FR-GAME-006 checkpoint/result/intermission/restart | 2/6 | rules/runtime/presentation | Phase 2 failure/restart regressions + Phase 6 result/intermission evidence | phase2-verified failure/restart subset; Phase 6 result/intermission open |
| FR-GAME-007 AI uses same rules | 8 | `src/ai` → command interface | identical-rule/replay benchmarks | planned |
| FR-GAME-008 valid generated backbone | 6 | `src/generation` | property/seed validity corpus | planned |
| FR-GAME-009 bounded cosmetic-focused economy | 6 | resources/economy contracts | economy simulation/exploit tests | planned |
| FR-GAME-010 moderated replayable viewer influence | 9 | `src/influence` + external adapter | idempotency/moderation/provider tests | planned |
| FR-GAME-011 six differentiated districts | 4/10 | content packs/presentation/generation | district differentiation review | planned |
| FR-GAME-012 technical failure not game loss | 12 | supervisor/operations | chaos/recovery evidence | planned |
| NFR-DET-001 fixed 60 Hz authority | 1 | `src/config/version.ts`, `src/runtime/simulation.ts` | determinism suite + Phase 1/2 results | verified |
| NFR-DET-002 named seeded randomness only | 1 | `src/runtime/prng.ts` | random-stream isolation + nondeterminism scan + Phase 1/2 catalogue CI | verified |
| NFR-DET-003 identical-input checksums | 1 | `src/runtime/checksum.ts`, replay | repeat/replay/headless checksums + Phase 1/2 results | verified |
| NFR-ARCH-001 presentation/external cannot mutate authority | 1 | module boundaries | presentation/architecture tests + nondeterminism scan | verified |
| NFR-ARCH-002 serializable versioned contracts | 1 | state/command/event/snapshot types | state/snapshot/version-integrity tests + Phase 2 mid-vault restore regression | verified |
| NFR-PERF-001 Phase 1 p99/worst tick budget | 1 | simulation/headless runner | Phase 1 headless performance result | verified |
| NFR-PERF-002 degradation preserves critical info | 4/11 | presentation quality tiers | low-tier captures/perf evidence | planned |
| NFR-UX-001 five-second comprehension | 4 | camera/level/HUD | vertical-slice reviewer study | planned |
| NFR-UX-002 stop-ship overrides score | all | `AGENTS.md`, experience standard | phase review records | phase0-verified; enforced in Phase 2 reviews |
| NFR-ACC-001 multimodal/reduced-motion critical cues | 4/7/11 | AV/HUD/audio | accessibility capture/tests | planned |
| NFR-SEC-001 sensitive data excluded from authority/public output | 1/9 | architecture/input boundaries | architecture/presentation tests + later provider security tests | phase1-verified authority/public snapshot; Phase 9 open |
| NFR-ASSET-001 asset provenance and rights review | 0/all | `ASSET_LEDGER.md` | ledger/static review + release asset audit | phase0-verified for current references |
| NFR-REL-001 validated snapshot restore | 1/12 | `src/persistence/replay.ts` | restore/corruption/version-integrity tests + Phase 1 results + Phase 2 mid-vault continuation | phase2-verified mechanics continuation; Phase 12 production recovery open |
| NFR-REL-002 optional services cannot stop autonomous truth | 8/9/12 | policy/fallback/supervisor | outage/chaos tests | planned |

## Phase 0 Traceability Gate

Every PRD requirement has an owning phase and evidence path. Current reference/provenance policy and the score/stop-ship governance rule are the documentation/research items verified by Phase 0.

## Phase 1 Traceability Gate

The deterministic foundation on runtime candidate `b7b234f2d668c193ba106d1b67f18fa260a5630c` is verified by `evidence/eko-run/phase1/PHASE-01-RESULTS.md`, focused workflow run `34929904427`, and full catalogue workflow run `34929904443`.

Only Phase 1-owned runtime claims were closed there; precision movement and all later presentation/content/AI/viewer/reliability domains remained open.

## Phase 2 Traceability Gate

The deterministic precision-movement graybox on runtime/evidence candidate `af9d322115cd9c187d78823fd43bce0f938a3784` is verified by:

- `evidence/eko-run/phase2/PHASE-02-RESULTS.md`;
- `evidence/eko-run/phase2/PHASE-02-EXPERIENCE-REVIEW.md`;
- specialist review passes 1–3 under `evidence/eko-run/phase2/`;
- exact-candidate dedicated workflow run `34936307144`;
- exact-candidate full catalogue workflow run `34936307163`;
- Phase 2 runtime artifact `10383279034` with p99 `0.321217 ms`, worst `0.443234 ms`, deterministic repeat pass and snapshot/restore continuation checksum `5001c2e0f4caae6c`.

Phase 2 closes `FR-GAME-003` and the failure/restart subset of `FR-GAME-006`. It does not close character/outfit/animation, final camera/presentation, Lagos hazards/districts, AI policy, viewer interaction/economy, accessibility presentation, or production recovery/readiness requirements.
