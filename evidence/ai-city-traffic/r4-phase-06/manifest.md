# AI City Traffic Experiment R4 Evidence Manifest

The exact candidate SHA is supplied by CI as `CANDIDATE_SOURCE_SHA`; the generated `artifacts/traffic-phase6/release-validation.json` is the authoritative candidate-bound manifest. This repository document records the software evidence locations without pretending to be independent or real-elapsed production evidence.

## Software gates

| Phase | Commit | Evidence |
|---|---|---|
| 1 | `e826985a31173e51b01ed6fda09bb7eea890cd53` | deterministic authority tests and headless checksum |
| 2 | `415c8317ee6fed9aac6fa9ca2ecb2da94a7ce43d` | adaptive AI tests and deterministic campaign |
| 3 | `670b1765ecd2859c3cf35d21e55231c128b4b429` | stream self-test and Playwright captures |
| 4 | `941eedfaf3705747ecf20a4b76f60d7bc3a70732` | audience safety and idempotency tests |
| 5 | `4d5c6351043061461781d2ef0fa791d92eb15641` | verified restore, health, chaos, and soak evidence |
| 6 | candidate-bound CI SHA | release validation, score, traceability, runbooks, and review |

## Final software verification

- 46 / 46 traffic Node tests pass.
- 32 / 32 deterministic campaign runs complete with zero technical outcomes and zero invariant failures.
- 8 / 8 chaos scenarios pass; persistent snapshots are atomic, owner-only, restorable, and quarantine corrupt files.
- Desktop and mobile visual captures pass hierarchy, overflow, console, and reduced-motion checks.
- Candidate validator score: 88 / 100, R4, externally blocked.

## Truthful status

Software verdict: PASS when final CI remains green. Highest truthful readiness: R4. Production ready: false until all external R5 evidence is exact-candidate, current, real elapsed, independently witnessed/reviewed, and passing.
