# AI Dungeon Phase 5 Engineering Evidence

This bundle defines reproducible software evidence for the Game 9 reliability gate.

- `tests/phase5/dungeon-operations.test.cjs` covers writer fencing, reservation/commit idempotency, bounded live journal state, verified snapshot recovery, corrupt-snapshot fallback, quarantine, independent output/audio/progress health, crash-loop breaking and operator authorization.
- `npm run dungeon:phase5:chaos` runs a deterministic compressed fault/recovery campaign and emits a canonical checksum.
- Real 24/72-hour wall-clock soaks, production-reference output capture, credentialed providers, witnessed recovery drills and seven-day canary remain external R5 evidence and are intentionally not fabricated.
