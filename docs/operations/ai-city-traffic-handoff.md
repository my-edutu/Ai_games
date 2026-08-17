# AI City Traffic Experiment Operations Handoff

## Runtime commands

- Build: `npm run build`
- Complete tests: `npm test`
- Focused traffic phases: `npm run test:traffic:phase1` through `npm run test:traffic:phase6`
- Headless experiment: `npm run traffic:headless`
- Deterministic campaign: `npm run traffic:campaign`
- OBS/browser source: `TRAFFIC_SNAPSHOT_PATH=/persistent/traffic.snapshot.json npm run traffic:stream`
- Stream self-test: `npm run traffic:stream:self-test`
- Chaos evidence: `npm run traffic:phase5:chaos`
- Candidate validation: `CANDIDATE_SOURCE_SHA=<40-char-sha> npm run traffic:phase6:validate`

## Operational ownership

Release owns the frozen manifest and evidence bundle. On-call owns health, restore, safe scene, and rollback. Security owns provider credentials, privacy, moderation, and supply-chain attestations. Product owns audience policy eligibility and public communication.

## Current truthful status

All six software phases are implemented and locally verified as an R4 production candidate. R5 remains evidence-gated until the exact deployed candidate completes the external evidence sequence in the evidence-intake document.

## Durable host requirements

Mount `TRAFFIC_SNAPSHOT_PATH` on durable storage with an operator-controlled parent directory. The host writes through an owner-only temporary file, fsyncs, atomically renames, verifies before restore, quarantines corrupt state, and stops after the bounded recovery breaker opens. A quarantined host requires operator investigation; deleting evidence and silently starting a fresh run is prohibited.
