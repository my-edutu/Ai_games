# AI Escape Room Phase 2 Evidence

**Candidate scope:** public observation, bounded belief/planning, pathologies, hazard behavior, progression and seeded campaign.

## Observed verification

| Command | Result |
|---|---|
| `npm run test:phase2:ai` | 8 tests passed, 0 failed |
| `npm run test:phase2:campaign` | 6 tests passed, 0 failed |
| `npm run test:phase1` | 15 tests passed, 0 failed |
| `npm run escape-room:campaign` (run 1) | 64/64 fair escapes, checksum `0e73c932` |
| `npm run escape-room:campaign` (run 2) | byte-identical output, checksum `0e73c932` |

## Load-bearing regression discovered

The first 48-run campaign produced three hazard failures despite the policy's active-hazard wait reflex. Root cause: repeated-action recovery could replace a safe wait with an inspection while a hazard was active. The campaign test remained red until recovery was made subordinate to the hard safety layer. The corrected campaign produced 48/48 escapes; the 64-run release campaign also produced 64/64 escapes.

## Claims proved

- Hidden solution/oracle fields do not cross the observation, public-belief or public-intent boundaries.
- The autonomous policy completes varied rooms without remote inference or oracle actions.
- Planner work remains within the 64-expansion budget.
- Hazards telegraph before activation and unsafe actions have a replay-visible causal result.
- Loop recovery cannot override hazard safety.
- Continuous room progression is deterministic and bounded.
- Campaign reporting separates valid game outcomes, technical failures, invalid content and fallback content.
- Campaign output, metrics and run checksums are deterministic.

## Evidence boundary

This evidence is accelerated local software verification. It is not real elapsed soak/canary evidence and is not a substitute for external provider, host, witnessed drill or independent exact-candidate validation.
