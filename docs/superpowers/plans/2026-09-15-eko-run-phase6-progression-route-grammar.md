# Eko Run Phase 6 — Progression, District Ladder and Deterministic Route Grammar

> Implementation plan. Execute with TDD and the Eko mandatory skill gate.

**Goal:** turn the verified Mainland/hazard slice into a renewable six-district authoritative campaign while preserving deterministic 60 Hz gameplay truth, fair generated geometry, causal progression and cosmetic-only rewards.

**Architecture:** keep the simulation as sole authority. Generation is a bounded pure/cold-path function of version + root seed + district index + cycle + named layer key. It constructs a guaranteed traversable backbone first, then deterministic hazards, token placements, route decisions, milestones and difficulty metadata, validates hard constraints, applies at most three targeted repairs and otherwise returns a known-good versioned fallback. Active generated content is copied into serializable authority and covered by checksum/snapshot/replay. Presentation sees only sanitized district/progress/reward facts.

**Phase boundary:** Phase 6 owns mechanical district differentiation, progression state, deterministic content grammar, reward ledger and intermission/advance lifecycle. It does not own Phase 7 broadcast polish or Phase 10 full visual district packs/set pieces.

## Task 1 — RED contracts

Create Phase 6 tests before production code for:
- fixed six-district ladder and deterministic wrap/cycle;
- same-input generation equality and cross-seed diversity;
- guaranteed continuous backbone, ordered checkpoints and in-bounds content;
- bounded repair/fallback diagnostics;
- multi-axis difficulty profiles rather than raw-speed-only scaling;
- district intermission + explicit replayable `advance` command;
- deterministic token collection and idempotent cosmetic unlock ledger;
- snapshot/restore/checksum coverage and sanitized render projection;
- Phase 1–5 regressions.

Observe the dedicated workflow fail for missing Phase 6 behavior before implementation.

## Task 2 — District and generation contracts

Add `src/generation/` with:
- six stable district IDs: Mainland Morning, Market Rush, Danfo Junction, Rainy Lagos, Island Night, Bridge Run;
- versioned per-district grammar/difficulty profiles;
- deterministic named layer samplers (`backbone`, `hazards`, `rewards`, `decisions`, `pacing`);
- generated route, hazard, token, route-decision and milestone schemas;
- hard validator with typed diagnostics;
- max three deterministic repair attempts;
- known-good fallback retaining original seed identity and exposing repair/fallback state;
- stable content fingerprint for corpus evidence.

Backbone must be constructively traversable at ground level. Optional challenge can never delete or block the mandatory path.

## Task 3 — Progression and economy authority

Add `src/progression/` and extend authoritative types/state:
- `ProgressionState`: district index/id, cycle, district completions, total distance, pacing band, generation diagnostics and active generated content metadata;
- bounded reward ledger: Eko Token balance, collected token IDs, awarded milestone IDs, cosmetic/theme/celebration unlock IDs;
- token balance cap and bounded identifier sets;
- unlock thresholds grant presentation identity only; no speed, collision, invulnerability or success modifiers;
- `intermission` lifecycle and `advance` command accepted only from intermission;
- deterministic Bridge Run → Mainland Morning cycle wrap.

District completion must preserve a causal record and enter intermission instead of silently replacing the route mid-action. `advance` starts the next district from a safe fresh spawn.

## Task 4 — Runtime/checksum/snapshot integration

- create `createPhase6State(config)` without changing historical Phase 1–5 factories;
- use active generated hazard contracts when Phase 6 progression exists, otherwise retain Phase 5 contract behavior;
- collect generated tokens once, emit semantic reward events and update pacing/checkpoint/district events deterministically;
- include all outcome-relevant progression/economy/generated-content facts in checksum and snapshots;
- expose only public district, cycle, pacing, token and unlock facts in immutable render snapshots;
- keep generator seed keys/random cursors private;
- bump state/deterministic/content/snapshot/checksum versions as required, while keeping command schema v1 backward compatible.

## Task 5 — Review Pass 1: generation validity

Adversarial corpus:
- at least 1,000 deterministic seed/district/cycle combinations;
- every final route validates;
- no infinite retry; repair count bounded;
- fallback observable and valid;
- checkpoints/finish/content remain in bounds;
- unique-content/fingerprint rate meets declared threshold;
- generated hazards preserve minimum spacing/response assumptions.

Write failing regression first for any discovered load-bearing defect, fix root cause, rerun focused + prior regressions.

## Task 6 — Review Pass 2: reward/exploit integrity

Attack:
- duplicate collection/replayed tick;
- restart/snapshot restore around collection;
- token cap/overflow;
- duplicate unlock/milestone grants;
- cosmetic unlocks changing movement/collision outcome;
- unbounded ledger growth.

RED → fix → GREEN with explicit review record.

## Task 7 — Review Pass 3: transition/replay integrity

Attack:
- completion and `advance` in conflicting command sets;
- `advance` while running/failed;
- district change retaining stale checkpoint/hazard/token state;
- Bridge→Mainland cycle wrap;
- identical replay and snapshot restore across an intermission boundary;
- input array ordering and checksum stability.

RED → fix → GREEN with explicit review record.

## Task 8 — Evidence and closure

Add `scripts/run-eko-run-phase6-evidence.cjs` and dedicated workflow. Evidence must record:
- seed corpus size and all-six-district coverage;
- validation/fallback/repair distributions;
- deterministic repeated fingerprints/checksums;
- diversity ratio by district;
- multi-axis difficulty spread;
- ladder wrap and intermission/advance checks;
- economy idempotency/cap checks;
- snapshot/restore equality;
- generation p50/p95/p99/worst and simulation transition timing;
- Phase 1–5 regression results and authority-boundary scan.

Closure requires three clean review passes, no stop-ship/P1/P2 finding, focused exact-head success and full catalogue exact-head success before merge to `main`.
