# D04 — Retain authoritative Warden release through full warning-pool saturation

Status: **implementation committed for review; native tests and authentic Dungeon audiovisual playback UNVERIFIED**.

## Reproducible source-level defect

The D04 signal InstancedMesh retains eight slots. A genuine final Warden warning can fill all eight at priority 8. A subsequently witnessed Warden release has priority 7. Previously `allocate()` rejected that lower-priority release until the warnings naturally expired, even though the authoritative strike had already begun. A second rising warning at equal priority could also fail when its old rings occupied the same pool. This is a deterministic pool-order defect, **not** an observed in-game video verdict.

## Isolated correction

Only `public/ai-dungeon/physical-feedback-visuals.js` changes production behavior. An accepted new warning replaces prior warning-marker instances in the same `sceneKey`; an accepted, public `warden-release` cue retires its own older warning markers before allocating the signal instance. Retired matrices are hidden and marked dirty, `active` is decremented, and the pool remains visible when it still owns unrelated live signals. Audio submission checks can now reject obsolete warning slots via `hasLiveCue`, without claiming that sound reached a speaker. The opt-in `?feedback=d04` route, truthful authority planner, character rigs and all other ownership zones remain unchanged.

The new `retiredWarningMarkers` statistic makes retirement auditable. Fixed budgets remain **7 pools / 102 reserved instances / at most 7 VFX pool draw calls**. No new WebAudio nodes, buffers, assets, physics, or hit claims.

## Test-first review contracts

New cases appended to `tests/foundation/dungeon-d04-warden-warning-cells.test.cjs` exercise:
1. Eight final-warning slots must not hide a valid lower-priority release; an unverified release may not erase the warning.
2. An equally prioritized fresh danger footprint must replace the old footprint without over-allocation.
3. Invalid proofs, different-scene releases and unrelated signal cues must not be retired; reset cleans the pool.

The first two assertions fail logically under the prior allocator because all eight slots are occupied at equal/higher priority. **Tests were authored before the production patch but could not be executed red/green**: the shared coding tunnel returned NOT_FOUND/disconnected, and the independent container cannot resolve github.com. The native Node suite and Playwright, browser WebGL, sound, 390px and three-view moving-game captures, Warden combat/restart sequence, 20-minute resource soak and frozen BEFORE vs AFTER remain unverified.

Run after checkout on the D04 branch:

```sh
node --test tests/foundation/dungeon-d04-warden-warning-cells.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Use the pinned BEFORE `281735d0910c6b2443648af976003d50412ee324`, actual public snapshots and original capture-capable audio bus. Do not claim synchronization or visual parity from this source-only correction.

## Safety / rollback / review

Review stage: **NOT ACCEPTED**. No simulation/replay semantics altered. New state is bounded to one existing pool and its statistic; no external inputs or secrets. Revert this commit if real multi-view footage shows a needed intentional overlap between warning and release. The D10 integrator must assess real rendered transitions and the still-unverified GLB blade-tip problem before switching the default spectator.
