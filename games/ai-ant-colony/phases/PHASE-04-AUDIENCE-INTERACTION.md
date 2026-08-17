# Phase 4 — Bounded Audience Interaction

## Objective

Allow viewers to make visible, meaningful and disclosed choices without letting provider payloads, payment metadata, duplicate callbacks, abuse, outages or spending mutate gameplay truth directly.

## Implementation candidate

- Provider-neutral normalized vote envelope for YouTube, Twitch and test fixtures.
- HMAC-tokenized viewer identity; display names and raw provider payloads never enter game state.
- Authentication, schema, moderation, region, age-window, future/stale, entitlement, per-viewer, global-rate and idempotency gates.
- Rejected input does not consume accepted rate capacity.
- Logical-tick vote windows with legal options, one-viewer-one-vote, bounded weights and named-RNG tie resolution.
- Ten-effect colony catalogue: nectar bloom, gentle rain, scout surge, tunnel direction, alarm beacon, shade canopy, fungus-garden pulse, predator warning, colony theme and bounded challenge pressure.
- Every effect defines a maximum magnitude, cooldown, duration/conflict group, disclosure and explicit prohibition on guaranteed terminal outcomes.
- Pre-authority scheduled command application, exact-once IDs, bounded queue/history, expiry, cooldown rejection and append-only reversal records.
- Candidate placement excludes occupied/illegal cells; tunnel votes mark pheromones instead of carving directly.
- Challenge pressure refuses unsafe queen/population states; support effects cannot directly create ascension.
- Zero-audience, complete-provider-outage and maximum-bounded-pressure deterministic campaigns.
- Public snapshots expose only bounded effect status and sanitized effect IDs, never idempotency keys, viewer tokens, cooldown maps or command IDs.

## Required verification

The exact candidate must pass:

```text
npm test
npm run ant:stream:self-test
authoritative nondeterminism scan
npm run test:browser
```

The phase may be promoted to PASS only after GitHub Actions verifies the exact commit with zero test failures and no open P0/P1 findings.

## Honest boundary

This phase uses provider-faithful normalized fixtures and provider-neutral contracts. It does not claim live credentialed YouTube/Twitch operation, production moderation/entitlement uptime, durable external audit storage, chargeback operations, public canary or R5 readiness. Those remain Phase 5–6/external gates.
