# Marble Survival Tournament — Product Requirements Document

**Status:** Approved  
**Product level:** Catalogue game / deterministic-physics and mass-participation proof  
**Primary output:** 16:9 browser/OBS livestream source with clean-feed and mobile-safe hierarchy

## Product Outcome

Deliver an autonomous five-round tournament in which viewers can immediately choose favourites, understand qualification pressure, witness causal physics, influence only bounded disclosed future conditions, receive a satisfying champion resolution, and see a new seeded tournament begin automatically.

## Functional Requirements

- `FR-MAR-001`: authority advances on fixed logical ticks using integer fixed-point state.
- `FR-MAR-002`: equal inputs, versions, configuration, seed streams, and scheduled effects produce identical checkpoints and champion.
- `FR-MAR-003`: launch tournament quotas are 32→16→8→4→2→1; custom test configurations remain monotonic and end at one.
- `FR-MAR-004`: arena generation is seeded, bounded, validated, repairable, and falls back without silently changing seed.
- `FR-MAR-005`: moving/static collision order is stable and outcome-critical geometry cannot be tunnelled through at validated speed.
- `FR-MAR-006`: marbles expose bounded personality traits, legal actions, deterministic fallback, stuck detection, and allowlisted public intent.
- `FR-MAR-007`: finishes, eliminations, timeouts, round advancement, champion, intermission, and restart are automatic and event-auditable.
- `FR-MAR-008`: technical/integrity failure enters quarantine and never counts as a legitimate game loss or record.
- `FR-MAR-009`: public output permanently communicates round, survivors, quota, danger, progress, record, intent, and next interaction.
- `FR-MAR-010`: visual identity uses number, pattern, icon, outline, and trail—not colour alone.
- `FR-MAR-011`: semantic events drive bounded camera, VFX, music, SFX, captions, and reduced variants.
- `FR-MAR-012`: fixed-choice audience effects are validated, rate-limited, idempotent, scheduled, capped, reversible, and replayable.
- `FR-MAR-013`: no free or paid interaction can select a champion, guarantee survival/loss, or secretly change records.
- `FR-MAR-014`: authoritative assistance uses a separate `assisted` record category.
- `FR-MAR-015`: snapshots, event sequences, RNG streams, versions, checksums, and restore invariants are durable and verifiable.
- `FR-MAR-016`: provider, renderer, audio, analytics, and optional persistence outage do not stop authoritative continuity where integrity permits.

## Non-Functional Requirements

- tick p99 below 8 ms for launch maximum on reference Node 22 hardware;
- sanitized render snapshot p99 below 4 ms;
- browser source target 60 fps with a 30 fps quality fallback;
- bounded bodies, colliders, contacts, effects, voices, cards, event history, replay frames, queues, and idempotency records;
- zero duplicate authoritative effect applications;
- no secrets, raw provider payloads, payment data, raw chat, private IDs, seeds, configs, stack traces, or prompts in public output;
- critical meaning survives muted audio, grayscale/colour-vision variation, reduced motion/flash, mobile viewing, and stream compression;
- 72-hour candidate soak and seven-day canary must pass before unattended production promotion.

## Success Metrics

Ten-second comprehension, tournament/round duration distributions, timeout and quarantine rates, archetype championship share, first-seed share, lead changes, close finishes, dramatic-pattern diversity, duplicate/rejected/expired influence rates, consequence visibility, tick/render/audio/output availability, restore checksum success, resource slopes, result-to-next-run interval, and rollback readiness.
