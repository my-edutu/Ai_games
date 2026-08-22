# Turnve BuildSite — Technical Architecture

## Workspace

Standalone Vite package under `games/turnve-buildsite/`. It is intentionally excluded from the root CommonJS compiler so browser dependencies do not destabilize existing headless games.

## Boundaries

- `simulation`: pure typed rules and evaluation.
- `state`: Zustand store, persistence, presenter actions.
- `three`: visual world consuming immutable state/actions.
- `ui`: HUD/tablet/artifacts/report.
- `ai`: TARI adapters.

## Determinism

Scenario events use simulated time/progress thresholds, not wall-clock randomness. Presenter controls dispatch the same typed events used by normal flow. Reset restores the same initial scenario.

## Persistence

Settings, artifact drafts, last run, highest score, and guidance preference use localStorage through a narrow adapter so persistence can move to Supabase later.

## Security

No secret is required. Optional external AI is disabled unless explicitly configured through a server-capable adapter. Export contains simulation result data only.
