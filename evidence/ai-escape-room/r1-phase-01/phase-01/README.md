# AI Escape Room Phase 1 Evidence

**Candidate scope:** deterministic generation, validation, rules, runtime, snapshot/restore and headless execution.

## Observed verification

| Command | Result |
|---|---|
| `npm run test:phase1:generation` | 7 tests passed, 0 failed |
| `npm run test:phase1:runtime` | 8 tests passed, 0 failed |
| `npm run test:phase1` | 15 tests passed, 0 failed |
| `npm run escape-room:headless -- --seed=phase-01-proof` (run 1) | PASS |
| `npm run escape-room:headless -- --seed=phase-01-proof` (run 2) | PASS, byte-identical JSON output |

## Claims proved

- Same seed/configuration produces identical room, diagnostics and result.
- Cosmetic stream draws do not perturb authoritative generation.
- Every generated normal room has one solver route or generation falls back observably.
- Illegal actions do not mutate state.
- Mid-run snapshot restore matches uninterrupted execution.
- Corrupt and incompatible snapshots fail with typed errors.
- Headless mode reuses the authoritative rule implementation.

## Evidence boundary

These are local deterministic software checks. They do not represent elapsed soak, canary, provider, witnessed drill or independent R5 evidence.
