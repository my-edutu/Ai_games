# Shared Procedural Content Engine

## Mission

Generate renewable game content that is deterministic, valid under exact game rules, diverse in meaningful features, bounded in cost and state, and diagnosable when generation fails.

## Architecture

```text
Content Profile + Seed + Game Capabilities
  → Constructive Grammar
  → Candidate Content
  → Hard Validators / Solver Oracle
  → Deterministic Repair
  → Feature Extraction and Difficulty Estimate
  → Approved Content Instance or Known-Good Fallback
```

The engine coordinates common manifests, attempts, seeds, validators, repairs, feature metrics, caches and evidence. Each game supplies its grammar, capability model, rule-exact validators or oracle, and content schema.

## Content Definition

Every generator/profile declares stable ID and version, game/deterministic/content compatibility, input ranges, named random streams, hard constraints, soft targets, maximum attempts/work/memory/output, repair order, fallback, feature extractor, duplicate fingerprint, difficulty estimate, asset dependencies and test profile.

## Rules

- Construct required connectivity, objective/dependency path and safe start before optional decoration.
- Validate using exact authoritative rules; a visual approximation is insufficient.
- Never hide an invalid seed by counting it as game failure.
- Repair is deterministic and bounded; each action is recorded.
- Fallback preserves failed seed/profile diagnostics and uses a declared known-good content instance.
- Content generation cannot block the authoritative tick; pre-generation or bounded asynchronous work uses stable selection.
- Generated text and assets are schema-safe, moderated, licensed and unable to execute code.
- Feature diversity is measured; unique seeds with equivalent structure fail novelty review.
- Content packs are versioned, verifiable where available, compatible and reversible.

## Validator Classes

Connectivity and reachability; capability and trajectory; key/dependency/solution count; safe spawn and response; clearance and collision; resource/economy viability; demographic/ecosystem viability; fairness and symmetry; performance/entity/sensory budgets; content/moderation/licence; no soft lock or infinite generation; record/mode eligibility.

Games may use a solver oracle that receives complete truth but remains inaccessible to normal agent observations and public presentation before result.

## Feature and Difficulty Evidence

Extract graph/topology, path, bottleneck, branch, dependency, timing, threat, resource, combat, physics, visibility, population, economy and workload features appropriate to the game. Stratify seed campaigns by these features. Store representative and pathological seeds, not only aggregate pass rates.

Difficulty estimation is a versioned prediction used for selection and analysis; it does not replace empirical AI outcome campaigns.

## Caching and Distribution

Cache key includes game/generator/profile/version/seed/capability/config/content hashes. Cache stores candidate output, validator/repair/feature result and checksum. Reject incompatible or corrupt entries. Production hosts may pre-generate pools, but selection remains seeded and replayable, and exhaustion falls back safely.

## Telemetry

Record attempts, generation/validation/repair/fallback time and memory, failed constraint, feature vector or band, duplicate score, output size and entities, AI outcome correlation, and cache result. Avoid seed/run IDs as metric labels; keep detailed diagnostics in bounded evidence or log storage.

## Testing and Acceptance

Property tests, rule-exact oracle fixtures, bad-seed regressions, termination and attempt bounds, stream isolation, duplicate/diversity analysis, performance tails, cache compatibility, malformed content packs and load/soak are mandatory.

The engine is ready for a game only when every activated content class passes hard constraints, generation/repair/fallback terminate within budgets, features are materially diverse, invalid instances never enter ordinary play and the output reproduces from recorded inputs.
