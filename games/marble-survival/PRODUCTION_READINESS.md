# Marble Survival Tournament — Production Readiness

**Current verdict: upgrade in progress; no R5 promotion.** The scoped September 10 hardening passes its fresh software checks. The overall approved game still has open gameplay and operational requirements; green CI is not a substitute for them.

## Verified scoped evidence

Code revision `7de7b565657d8bb7137e20401f1f9ce1158b2bdb`; GitHub Actions run 69 / `34464582959`; artifact `10146984794`. Build, focused Game 7 tests, HTTP self-test, ambient-nondeterminism scan, dependency audits, six browser scenarios and the authority p99 performance budget pass. Local focused tests: 62/62, no skips. The source archive was compared with the locally tested implementation.

A separate 32-seed production-rule campaign verified exact brackets, valid champions, matching twin replays, 160 round-boundary JSON restores and 16 exactly-once wind applications. It is not a balance certification.

## Open product blockers

1. Default tournaments completed in 10.18–12.32 seconds in that corpus, far below the approved minute-scale design.
2. Every sampled championship (32/32) used fallback geometry. Safe completion does not establish intended final-arena quality or diversity.
3. Five of six influence families remain unavailable. Wind uses first eligible request, not majority voting.
4. Full AI personality/cadence, decisive replay/camera coherence, low-bitrate/mobile identity readability, Canvas reduced-motion behavior, material/feedback quality and natural dense-contact stability have incomplete evidence.

Do not relabel these as external evidence only or mark the full upgrade complete.

## Operations and external gates

Production ingress/rate capacity, verified provider identity/credentials, multi-session abuse controls, operator roles/audit, durable host checkpoint journaling, run fencing, process/output/audio recovery and rehearsed rollback are not demonstrated. Anonymous signed cookies are not a production anti-bot system. Checksums establish data consistency, not authenticity against an attacker who can replace an entire snapshot.

Required external evidence remains: genuine 72-hour candidate soak, seven-day canary, independent security/accessibility reviews, witnessed recovery/rollback drill, credentialed production-provider session and representative low-end/OBS capture-chain performance. Short Node tick profiles and screenshots cannot close these gates.

The whole-catalogue `npm test` attempt exceeded the local execution budget without final totals. Game 7 checks passed, but integration into unrelated catalogue changes is not certified. No merge or deployment has been performed.

## Compatibility and handoff

Snapshot restore now requires `wind-policy-v2` plus `marble-physics-v2`. Older input-policy snapshots are rejected; start fresh at the deployment boundary. A safe rollback must also use a compatible snapshot or begin a new tournament.

See `docs/reviews/2026-09-10-game7-hardening.md` for evidence identity, findings and the next implementation priorities. This is an implementer candidate review, not independent release sign-off.
