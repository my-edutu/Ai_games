# Game 10 — AI Zombie Survival Delivery Ledger

**Branch:** `agent/game-10-ai-zombie-survival`  
**Base:** `68493d9d90d244797f052ebe2bb1d8b1895a64c8`  
**Method:** Ralph loop with test-first vertical phases, separate specification/quality review, exact-candidate evidence and fail-closed R5 assessment.

| Phase | Target | Status | Exit evidence |
|---|---|---|---|
| 1. Deterministic Foundation | R1 | In progress | Build, foundation tests, replay/snapshot/invariant corpus, headless evidence |
| 2. AI, Hordes, Economy, Progression | R2 gameplay | Not started | Agent/horde/economy tests, campaigns, balance and dramatic-pattern evidence |
| 3. Broadcast Experience | R2 streamed | Not started | Stream self-test, Node presentation tests, Chromium captures, accessibility/output review |
| 4. Audience Interaction | R3 | Not started | Safety/idempotency/vote/reversal/outage tests and pressure campaigns |
| 5. Reliability and Operations | R4 | Not started | Restore/fencing/RBAC/supervisor tests, chaos artifact, runbook and rollback drills |
| 6. Production Validation | R5 candidate | Not started | Exact-source validator, traceability, capacity, drill/canary contracts and assessor |

## Phase rule

Advance only when the current phase's focused tests, all affected regressions, exact acceptance checklist, specification review and quality review pass with no open P0/P1 finding. A phase may be software-complete while its external production evidence remains blocked.

## External R5 boundary

The ledger cannot mark production ready until genuine credentialed provider evidence, production-reference capacity and audiovisual evidence, external security/privacy/moderation/accessibility/licence/supply-chain attestations, independently witnessed drills, a real 72-hour frozen-candidate endurance run, a real seven-day limited-audience canary, and an independent exact-candidate final review cause the assessor to return `PASS / R5 / 100 / productionReady=true`.