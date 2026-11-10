# Infinite Tower Climb P0 — recover original source-backed 3D camera test evidence

**2026-11-10 — Draft PR #68 — P0 OPEN — assessor: NOT EVALUATED**

## Source-of-truth inspection

Frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9`. Source game/presentation under examination: `8e54c4edf26de3bf0578a4b5348d006ce844552f`. The exact-source [quality run 42903135744](https://github.com/my-edutu/Ai_games/actions/runs/42903135744) built successfully and passed the structural verdict and full-loop witness gates, but its **original Node logic safety suite failed 23/1344** (1321 passes). All 23 shared `ReferenceError: observedLockedGuardianCap is not defined` in original camera projection tests. Dependent browser checks were skipped. This is a verification veto, not a score and not confirmed live-game behavior.

The real source `scene.mjs` imports `observedLockedGuardianCap` from `guardian-passage.mjs` and calls it in `composeFollowView`. Eight regression files run the unmodified real camera inside Node `vm` after stripping all source imports, but supplied an increasingly partial hand-maintained context. A shipped helper already identified named source dependencies and checked real ESM exports; it had not been connected to these tests. This explains the common missing symbol without blaming source gameplay or silencing tests.

## Committed P0 evidence unblocker

[Commit ba8006c8](https://github.com/my-edutu/Ai_games/commit/ba8006c8a780821f02e20a439071a08f7aeb5c89) updates the shared VM importer and all eight failing original-camera test fixtures. Each fixture now resolves the **actual named ESM scene observers**, asserts each real export exists, and hydrates only missing variables before executing the original renderer camera logic. Existing real `THREE`, preconfigured fixture sources and projection/invariant assertions remain in place. No guessed stubs, no defeated safety gates and no edits to the playable renderer, guardian, deterministic authority, crossover physics, procedural world, frozen baseline or PR58.

**Exact-head verification:** [quality 42905177383](https://github.com/my-edutu/Ai_games/actions/runs/42905177383) queued at ledger write — **NOT YET PASSED**. Authenticated coding terminal tunnel disconnected; no local full Node/Three/Playwright run claimed.

## Actual footage and next stage decision

Previous [10/10 original video run 42898824459](https://github.com/my-edutu/Ai_games/actions/runs/42898824459) at `2bb3a0f836` captured the full original 60+ second matrix and native compositor event clocks. Prior portrait danger video at ~14–23s contains an unclear near-camera guardian/hero body crop, along with split combatants and a crowded bronze/cyan cap stage. [New original 8e54 source capture 42903135945](https://github.com/my-edutu/Ai_games/actions/runs/42903135945) was in progress when inspected: its rendered hero/guardian action and floor-nine threshold are **NOT EVALUATED**. Source event clock correspondence does not equal visual action verification.

**Next highest-impact:** confirm the current original Node/Three tests pass; inspect actual unedited, normal-speed 960×600 and 390×844 original guardian/crusher through HP0 → walked cap threshold → floor-nine → outcome/restart, with recorded source events beside frames. If current two-body motion remains masked or cut off, reopen physical 3D staging/camera composition as one connected experience. Never mark P0 complete from green CI alone.

Independent anonymous matched full-motion reviewers **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Supported real-device p50/p95/p99 frame times, memory and accessibility not evaluated. No merge, deploy, draft-status change, force-push or baseline move.
