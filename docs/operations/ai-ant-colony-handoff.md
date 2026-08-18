# AI Ant Colony / Ecosystem — Operations Handoff

## Candidate scope

Game 12 is complete through six software phases on `agent/ant-colony-all-phases`. The authoritative runtime is deterministic and fixed-step. Presentation, providers, operations, and release validation are outside gameplay truth. The default release verdict is intentionally R4 `BLOCKED`, not R5 `PASS`, until external evidence is collected for the exact release-manifest checksum.

## Services and entry points

- Authority and lifecycle: `games/ai-ant-colony/src/runtime/run.ts`
- State and invariants: `games/ai-ant-colony/src/state/`
- Ecosystem and AI: `games/ai-ant-colony/src/ai/` and `rules/`
- Snapshot/restore: `games/ai-ant-colony/src/persistence/snapshot.ts`
- Audience influence: `games/ai-ant-colony/src/influence/`
- Channel operations: `services/ant-colony-channel/src/index.ts`
- Health, drills, chaos: `games/ai-ant-colony/src/operations/`
- Release validation and score: `games/ai-ant-colony/src/release/`
- Browser source: `public/ai-ant-colony/`
- Stream host: `scripts/serve-ant-colony-stream.cjs`
- Phase 5 evidence: `scripts/run-ant-colony-phase5-chaos.cjs`
- Phase 6 evidence: `scripts/run-ant-colony-phase6-validation.cjs`

## Normal operation

Start the stream host with `npm run ant:stream`. Confirm `/ant/health` before adding it to OBS. Use the clean feed for public capture and expose operator controls only on a private authenticated surface. Monitor simulation progress, snapshot freshness, frame movement, luma, expected scene, audio age, queue utilization, memory slope, resource pressure, lease generation, command sequence, and authoritative checksum.

Audience interaction is optional. Loss of provider, moderation, entitlement, audit, or persistence certainty must disable unsafe interaction. Autonomous simulation should continue unless authority or durable reservation is unsafe. Do not restart the colony merely because provider input is absent.

## Incident rules

Use `docs/operations/ai-ant-colony-runbook.md`. Protect state first, then public output. For stale authority, fence the writer and perform verified restore. For black/frozen/wrong-scene output, switch to the safe scene before restarting presentation. For persistence failure, reject commands before mutation. For divergence or sequence gaps, quarantine. Never manufacture extinction, ascension, prize, record, or viewer-caused terminal outcome during an incident.

## Promotion checklist

Before R5, attach production-reference capacity, credentialed provider validation, external safety attestations, real 72-hour endurance, witnessed mandatory drills, seven real elapsed canary days, and an external-signed independent review. Every artifact must identify the same candidate source SHA and manifest checksum. Material changes reset the relevant evidence clocks.

## Ownership

Release owner approves candidate and rollback. On-call owns incidents and recovery. Security owns credentials, privacy, moderation, sanctions, and unauthorized-control findings. Product owns viewer disclosure and fairness. An independent witness signs production drill evidence. No operator may self-approve R5.
