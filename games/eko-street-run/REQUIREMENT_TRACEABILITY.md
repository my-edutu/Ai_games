# Eko Run Requirement Traceability

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Map PRD requirements to owning phase, implementation path and falsifiable evidence.  
**Status:** `in-implementation`  
**Owning scope:** All phases  
**Last material review:** 2026-09-15  
**Version:** `TRACE-1.0`

`planned` means an exact owning phase/evidence is assigned but runtime implementation is not yet verified. `phase0-verified` is reserved for documentation/research-only requirements. Runtime requirements become `verified` only from their named evidence.

| Requirement | Owning phase | Implementation path | Test/evidence | Status |
|---|---:|---|---|---|
| FR-GAME-001 shared human/AI command interface | 1/8 | `src/runtime/commands.ts`, future input/AI adapters | `eko-run-commands.test.cjs`, Phase 8 AI benchmark | planned |
| FR-GAME-002 distance/checkpoint primary progress | 1/6 | `src/state`, `src/rules`, later HUD | state tests + Phase 6/7 captures | planned |
| FR-GAME-003 full precision controller | 2 | `src/physics`, movement rules | Phase 2 physics/experience suite | planned |
| FR-GAME-004 hazard warning/response fairness | 4/5 | hazard contracts + rules | hazard fairness corpus/replay | planned |
| FR-GAME-005 four equal-collision outfit families | 3 | presentation character/costume | silhouette/collision regression evidence | planned |
| FR-GAME-006 checkpoint/result/intermission/restart | 2/6 | rules/runtime/presentation | lifecycle/restart tests and captures | planned |
| FR-GAME-007 AI uses same rules | 8 | `src/ai` → command interface | identical-rule/replay benchmarks | planned |
| FR-GAME-008 valid generated backbone | 6 | `src/generation` | property/seed validity corpus | planned |
| FR-GAME-009 bounded cosmetic-focused economy | 6 | resources/economy contracts | economy simulation/exploit tests | planned |
| FR-GAME-010 moderated replayable viewer influence | 9 | `src/influence` + external adapter | idempotency/moderation/provider tests | planned |
| FR-GAME-011 six differentiated districts | 4/10 | content packs/presentation/generation | district differentiation review | planned |
| FR-GAME-012 technical failure not game loss | 12 | supervisor/operations | chaos/recovery evidence | planned |
| NFR-DET-001 fixed 60 Hz authority | 1 | `src/config/version.ts`, `src/runtime/simulation.ts` | determinism tests | planned |
| NFR-DET-002 named seeded randomness only | 1 | `src/runtime/prng.ts` | random-stream isolation + nondeterminism scan | planned |
| NFR-DET-003 identical-input checksums | 1 | `src/runtime/checksum.ts`, replay | repeat/replay tests | planned |
| NFR-ARCH-001 presentation/external cannot mutate authority | 1 | module boundaries | presentation/architecture tests | planned |
| NFR-ARCH-002 serializable versioned contracts | 1 | state/command/event/snapshot types | state/snapshot tests | planned |
| NFR-PERF-001 Phase 1 p99/worst tick budget | 1 | simulation/headless runner | Phase 1 performance result | planned |
| NFR-PERF-002 degradation preserves critical info | 4/11 | presentation quality tiers | low-tier captures/perf evidence | planned |
| NFR-UX-001 five-second comprehension | 4 | camera/level/HUD | vertical-slice reviewer study | planned |
| NFR-UX-002 stop-ship overrides score | all | `AGENTS.md`, experience standard | phase review records | phase0-verified |
| NFR-ACC-001 multimodal/reduced-motion critical cues | 4/7/11 | AV/HUD/audio | accessibility capture/tests | planned |
| NFR-SEC-001 sensitive data excluded from authority/public output | 1/9 | architecture/input boundaries | architecture/security tests | planned |
| NFR-ASSET-001 asset provenance and rights review | 0/all | `ASSET_LEDGER.md` | ledger/static review + release asset audit | phase0-verified for current references |
| NFR-REL-001 validated snapshot restore | 1/12 | `src/persistence/replay.ts` | restore/corruption tests | planned |
| NFR-REL-002 optional services cannot stop autonomous truth | 8/9/12 | policy/fallback/supervisor | outage/chaos tests | planned |

## Phase 0 Traceability Gate

Every PRD MUST above has an owning phase and evidence path. Phase 0 does not mark later runtime behaviour complete. Current reference/provenance policy and the score/stop-ship governance rule are the only PRD items eligible for Phase 0 verification.
