# AI Battle Royale Operations Handoff

## Service boundaries

Game 6 is autonomous first. The deterministic simulation, persistence/replay evidence, presentation host, audio, and audience integrations are separate operational concerns. Audience traffic may influence only the bounded global effects approved in Phase 4; provider loss must not stop the match. Presentation failures must not mutate simulation truth.

## Owner handoff

The gameplay owner is responsible for deterministic invariants, snapshot compatibility, replay equality, and game-result integrity. The platform owner is responsible for durable evidence, persistence freshness, capacity, and recovery infrastructure. The broadcast owner is responsible for the browser scene, render progress, audio/captions, and intentional safe scene. Security/community owners control provider authentication, moderation, region/entitlement certainty, and privacy. The release owner controls candidate identity, evidence freshness, rollback, and promotion decisions.

At shift change, hand over the exact candidate SHA, current run identifier, latest verified snapshot envelope checksum, replay manifest checksum, interaction status, last health observation, breaker attempt count, and any active rollback condition. Never hand over raw audience identity when a pseudonymous token is sufficient.

## Verified restore acceptance

A restore is acceptable only when schema and deterministic version are supported, the envelope checksum is valid, the enclosed state checksum is valid, Battle Royale invariants pass, replay reconciliation is bounded and deterministic, and public output is verified healthy before the battle scene resumes. Failed verification remains in recovery or enters safe halt after the finite breaker budget.

## Release boundary

Phase 5 software evidence can establish that recovery, quarantine, dedupe, health probes, and bounded chaos behavior are implemented. It cannot by itself establish R5. Production readiness still requires exact-candidate external evidence including credentialed production-provider validation, production-reference capacity, independently witnessed recovery/drills, real elapsed endurance, a real canary window, required safety attestations, and an independent current signed review. Until those artifacts exist, the highest truthful release state is the evidence-gated R4 boundary.
