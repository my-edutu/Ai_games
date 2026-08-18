# AI Zombie Survival — Phases 3–6 Completion Review

## Review scope

This review covers the Game 10 implementation carried from the verified Phase 2 baseline through the broadcast, audience-interaction, operations, and release-governance layers. The candidate is integrated onto current `main`; evidence from divergent historical heads is treated as background only.

## Review policy

For each phase:

1. Map MUST requirements to executable regressions.
2. Verify that presentation/integration code cannot become gameplay authority.
3. Check deterministic replay, privacy, idempotency, bounded-resource, failure-isolation, and recovery boundaries.
4. Classify findings as P0, P1, P2, or P3.
5. Resolve every software P0/P1 before phase exit.
6. Keep R5 blocked unless genuine exact-candidate external evidence exists.

## Findings and remediation

| Phase | Finding | Severity | Resolution |
|---|---|---:|---|
| 3 | Parallel game branches successively occupied Zombie’s browser port: Ant used `4175`, then Infinite Tower entered current `main` on `4176`. | P1 | Zombie now uses dedicated port `4177`; Playwright health, browser URLs, README, and phase contract were updated together. |
| 3 | Phase contract lacked measurable acceptance criteria and evidence mapping. | P1 | Expanded phase document maps public snapshot, UI, audio, accessibility, recovery, host, and Chromium requirements to tests/artifacts. |
| 4 | Phase contract did not make privacy, exactly-once, conflict, expiry, and outage guarantees auditable. | P1 | Expanded contract and retained deterministic influence/channel regressions. |
| 4 | Zombie checks were missing from current-main CI after branch divergence. | P1 | Added Zombie tests, deterministic scan paths, and unified evidence steps without removing Tower/Ant/Maze/Snake gates. |
| 5 | Historical completion text cited an obsolete SHA/run as if it were current proof. | P1 | Current PR-head CI and retained chaos artifact are the only current completion evidence. |
| 6 | The release manifest still emitted rollback SHA `f3ee747…` from a divergent historical branch. | P1 | A red regression on `e1b96f5` proved the mismatch; the manifest was first bound to verified integrated parent `74fadf884025abf127e949b7ab8a8d673d19fee7`. The current-main rebase will repeat this exact rollback-binding cycle against its freshly green parent. |
| 6 | Risk of treating green CI as production launch proof. | P0 prevented | Fail-closed validation remains: software `PASS`, readiness `BLOCKED`, highest truthful level `R4`, `productionReady=false` until external gates are real. |

Any failure discovered by exact-head CI reopens the relevant phase and blocks PR readiness.

## Verification matrix

| Gate | Phase coverage |
|---|---|
| `npm test` | All phases and all catalogue games |
| `npm run test:zombie:all` | Game 10 Phases 1–6 |
| `npm run zombie:stream:self-test` | Phase 3 host/privacy/recovery and Phase 5 continuity |
| Authoritative nondeterminism scan | Phases 1–6 deterministic authority |
| `npm run zombie:phase5:chaos` | Phase 5 failure/recovery |
| `CANDIDATE_SOURCE_SHA=<sha> npm run zombie:phase6:validate` | Phase 6 exact-candidate gate and truthful R4 block |
| `npm run test:browser` | Phase 3 responsive/accessibility/audiovisual capture |
| CI artifact publication | Phase 3, 5, and 6 evidence retention |

## Truthful completion decision

Phases 3, 4, and 5 may be marked software-complete after the exact PR head passes the matrix above. Phase 6 software may also be marked complete after those checks, but the game remains an **R4 candidate**. R5 remains blocked by real production-reference capacity, 72-hour endurance, credentialed providers, external attestations, witnessed drills, seven-day canary, and signed independent review.
