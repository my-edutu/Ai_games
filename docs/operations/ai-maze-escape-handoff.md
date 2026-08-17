# AI Maze Escape Production Handoff

## Current truthful state

- Phase 1 through Phase 6 software: complete.
- Reviewed runtime candidate: `cd77b7a59cbcf01074825777426c413b34d122be`.
- Reviewed workflow: `31998030132`.
- Node verification: 251 of 251 passed on the reviewed runtime candidate.
- Browser verification: 8 of 8 passed across the catalogue suite, including five Maze broadcast checks.
- Open software P0: 0.
- Open software P1: 0.
- Software verdict: PASS.
- Production-readiness score: 88 out of 100.
- Highest truthful readiness: R4.
- R5 verdict: BLOCKED by external evidence.
- Production ready: false.

## Runtime architecture

```text
Seeded maze generator and solution oracle
  → authoritative fixed-step Maze runtime
  → partial-observation belief map and bounded AI policy
  → keys, doors, traps, threats, progression and terminal classification
  → bounded audience candidates, votes and exactly-once effects
  → privacy-safe render snapshot, focused camera, HUD, audio/captions and replay
  → append-only commands/events/snapshots/audit
  → writer lease, verified recovery, fallback and quarantine
  → supervisor, output health, RBAC and chaos drills
  → frozen manifest, traceability, campaign, canary and readiness assessor
```

## Operator commands

```bash
npm ci
npm test
npm run maze:headless
npm run maze:stream:self-test
npm run maze:stream
npm run test:browser
npm run maze:phase5:chaos
CANDIDATE_SOURCE_SHA=<40-character-commit-sha> npm run maze:phase6:validate
```

## Normal operations

- Confirm one active writer lease and current snapshot age.
- Confirm simulation progress, renderer/capture freshness, expected scene, caption/audio status, queue ratios, memory slope, provider/moderation/audit health, and interaction disable state.
- Use typed operator controls only; never edit authority directly.
- Provider or moderation failure must degrade to complete autonomous play.
- Persist a snapshot before planned deployment, configuration, content, or credential work.

## Incident entry points

- Replay, checksum, unsolvable content, hidden truth, or private exposure: safe scene, disable interactions, fence writer, quarantine/verified restore.
- Black/frozen/wrong-scene/silent output: safe scene, restart isolated component, rebuild from latest accepted public snapshot, verify output.
- Provider/moderation/entitlement/audit failure: reject paid-eligible effects before mutation; autonomous play continues.
- Persistence failure: do not advance new authoritative commands without durable reservation.
- Crash loop: open breaker and halt automatic retries.

Use `docs/operations/ai-maze-escape-runbook.md` for the complete response and drill catalogue.

## Evidence locations

- Phase 1: `evidence/ai-maze-escape/r1-phase-01/phase-01/`
- Phase 2: `evidence/ai-maze-escape/r2-phase-02/phase-02/`
- Phase 3: `evidence/ai-maze-escape/r2-phase-03/phase-03/`
- Phase 5: `evidence/ai-maze-escape/r4-phase-05/phase-05/`
- Phase 6: `evidence/ai-maze-escape/r5-phase-06/phase-06/`
- Final review: `docs/reviews/AI_MAZE_ESCAPE_FINAL_REVIEW.md`

## External R5 handoff

The remaining 12 points require production-reference capacity and audiovisual evidence, credentialed current YouTube/Twitch evidence, external safety/accessibility/licence/supply-chain attestations, independently witnessed drills, a real 72-hour endurance run, a real seven-day canary, and an independent signed exact-candidate review. Follow `docs/operations/ai-maze-escape-r5-evidence-intake.md`.
