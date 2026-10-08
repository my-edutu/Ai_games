# AI Battle Royale

AI Battle Royale is Game 6 in the autonomous livestream catalogue: twenty-four deterministic contenders scavenge, fight and reposition through a shrinking arena until one champion remains.

## Readiness ledger

| Phase | Target | Status |
|---|---|---|
| Phase 1 — Deterministic Foundation | R1 | Complete; focused evidence passed |
| Phase 2 — Autonomous Combat and Progression | R2 gameplay | Ready to start |
| Phase 3 — Premium Broadcast Experience | R2 broadcast | Blocked by Phase 2 |
| Phase 4 — Audience Interaction | R3 | Blocked by Phase 3 |
| Phase 5 — Recovery and Operations | R4 | Blocked by Phase 4 |
| Phase 6 — Release Governance | R5 machinery | Blocked by Phase 5 |

The game cannot truthfully be called production-ready until the exact deployed candidate completes the external R5 programme in `PRODUCTION_READINESS.md`.

## Viewer promise

Twenty-four autonomous contenders with visible tactical identities fight for resources and position while the safe zone closes. Every result is rule-based, replayable and causally explained; audience influence is optional, global and bounded.

## Local command contract

The final implementation exposes focused phase tests, a headless runner, accelerated campaign, browser-source self-test, chaos campaign and release validator through root `package.json` scripts.


## 3D Gauntlet branch (experimental, not production-ready)

The `gauntlet/battle-royale-3d-broadcast-v1` branch extends the stream source with a **native WebGL2 3D visual adapter** without changing game rules, RNG streams, results or replay. The current procedural humanoid models and environment are *first-pass geometry*, not AAA character art.

```bash
npm ci
npm run build
npm run battle:stream
```

- **Watch autonomous gameplay:** `http://localhost:4176/battle`
- **View the live Gauntlet ledger and side-by-side 2D/3D:** `http://localhost:4176/battle/gauntlet`
- **Force original 2D stream for rollback:** `http://localhost:4176/battle?visual=2d`
- **Run focused tests:** `npm run test:phase3`
- **Run real-browser evidence suite:** `npm run test:browser`

See `docs/gauntlet/AI_BATTLE_ROYALE_3D.md` for the reference quality bar, staged objectives, measured gates and the still-open independent critic/visual fidelity work. Browser and external-production evidence remain required.
