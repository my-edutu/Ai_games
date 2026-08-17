# Game 11 — AI City Traffic Experiment

An autonomous, deterministic city-traffic spectacle designed for long-running YouTube and Twitch broadcasts. A signal-control intelligence coordinates many vehicles through demand waves, closures, competing priorities, and recoveries while viewers influence bounded policies rather than outcomes.

## Product promise

The city must keep moving. Viewers can understand the objective immediately through Mobility Score, flow per minute, congestion, incidents, records, and the AI’s current intent. Gridlock is a causal game outcome, never a hidden script.

## Architecture

```text
seeded city graph + demand streams
  → fixed-tick lane-cell authority
  → adaptive signals + bounded routing
  → incidents, waves and causal outcomes
  → normalized audience policy commands
  → privacy-safe render snapshots + semantic audio
  → verified snapshots, restore, health and quarantine
  → candidate-bound release validation
```

The browser renderer, audio, wall clock, providers, and telemetry cannot mutate authority. Authoritative randomness comes only from named seeded streams.

## Commands

```bash
npm run build
npm run test:traffic:phase1
npm run test:traffic:phase2
npm run test:traffic:phase3
npm run test:traffic:phase4
npm run test:traffic:phase5
npm run test:traffic:phase6
npm run traffic:headless
npm run traffic:campaign
TRAFFIC_SNAPSHOT_PATH=/persistent/traffic.snapshot.json npm run traffic:stream
npm run traffic:stream:self-test
npm run traffic:phase5:chaos
CANDIDATE_SOURCE_SHA=<40-char-git-sha> npm run traffic:phase6:validate
```

## Readiness

Software phases 1–6 are complete at R4 production-candidate level. The validator remains blocked from R5 until exact-candidate production-reference capacity, real 72-hour endurance, current credentialed provider tests, external safety attestations, independently witnessed drills, a real seven-day canary, and independent review all pass.
