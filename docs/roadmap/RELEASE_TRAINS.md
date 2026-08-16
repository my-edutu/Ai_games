# Release Trains and Environment Strategy

## Environments

- **Local/headless:** deterministic development and property or replay tests.
- **CI:** contract, unit, property, replay, security and bounded benchmark smoke.
- **Staging:** production-like processes, persistence, provider fixtures, OBS or capture and chaos.
- **Canary:** limited real channel and provider configuration with explicit rollback guardrails.
- **Production:** promoted immutable release with on-call and runbook ownership.

## Release Units

Platform packages, game module, configuration, content pack, presentation, assets and audio, provider adapters, service deployment and database schema are independently versioned but bundled in a release manifest with compatibility declarations.

## Train Rules

- Authoritative changes use a frozen candidate and reset affected deterministic, balance and recovery evidence.
- Provider, policy, security or content changes may require interaction disable or canary reset.
- Cosmetic-only changes still pass output, accessibility, resource and licence tests.
- Database, event or snapshot changes require migration plus rollback or fresh-run decision.
- A production channel never runs an untraceable floating branch or mutable configuration.
- Releases use gradual canary promotion, and the last compatible rollback remains ready.

## Cadence

Early implementation uses pull-request evidence and scheduled nightly campaigns. R4 candidates use a 24-hour engineering soak followed by a frozen 72-hour candidate soak. R5 uses a seven-day canary. Routine production releases may define risk-based durations but cannot weaken a game’s initial R5 criteria.

## Emergency Changes

Emergency interaction disable, credential revocation, safe scene and rollback may bypass normal scheduling but remain authenticated, audited, reviewed after action and followed by complete affected evidence before re-enabling.
