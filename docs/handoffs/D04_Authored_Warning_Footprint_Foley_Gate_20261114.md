# D04 — Bound original Warden warning sound to a coherent public danger footprint (14 Nov 2026)

**State:** test-first implementation source-verified; 332/332 native tests and TypeScript build pass in GitHub Actions. New real-browser acceptance is not established. **D04 is not accepted or production ready.**

## Scope, instructions, and branch safety

- Only `feat/dungeon-d04-combat-feedback-realism-20261108`; start of this increment: `6b4134af9bc859ceef7175e5aa04161a1af65f4a`.
- Reviewed `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, the frozen-before milestone `281735d0910c6b2443648af976003d50412ee324` as the untouched comparison target, the public D04 planner and original combat foley, previous live Chrome logs, and the game-audio, game-feel-vfx, and simulation-QA skills.
- The shared coding tunnel reports `Tunnel-client has not been seen for 300 seconds`; implementation and tests were committed through the GitHub connector. No local Dungeon browser was run.
- Protected files and branches untouched: `main`, Draft PR #49, `games/ai-dungeon/src`, rigs, camera, global lighting and other sessions.

## Observed defect and correctness boundary

The preceding completed real browser job [43578834800](https://github.com/my-edutu/Ai_games/actions/runs/43578834800) again rejected strict acceptance: `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Five browser diagnostics passed, but genuine WebGL frames were sparse, with recorded renderer-phase stalls in legacy as well as D04 mode. No causal attribution to D04 is justified, and the current 400ms authorization deadline must not be increased to hide stale contact.

Separately, code inspection found a narrower but real **sound-evidence defect**: named `boss-warning-rising` and `boss-warning-final` could be accepted when actor, tick and event ID looked coherent even if `detail.cells` was empty/out of bounds or `detail.footprintKey` was absent, reordered, duplicated or inconsistent with threatened cells. The rising cue also accepted a one-beat stage; a wide NOVA could imply a false four-beat warning; a narrow rift could claim a three-beat warning. These are source-contract vulnerabilities, not proven misfires in existing footage.

## Test-first change and native evidence

1. [RED test-only commit a0df49c](https://github.com/my-edutu/Ai_games/commit/a0df49cbee2fac287adcd7bbddec6f6c09c97233) adds a public-planner positive test for a genuine two-beat NOVA warning and one-beat RIFT final warning, then rejects empty/malformed/nonmatching marker sets, missing/unsorted/duplicated danger identity and contradictory release cadence. Invalid cues must not schedule sound or consume voices, recorded starts or confirmed-event history.
2. [Verified RED run 43584083532](https://github.com/my-edutu/Ai_games/actions/runs/43584083532): **331 passed, 1 failed at the expected new assertion** (`true !== false` for a structurally unsound danger warning).
3. [Source patch df3c599](https://github.com/my-edutu/Ai_games/commit/df3c599c025e15a279b62104d33cff1f52306e3b) validates the bounded full danger fingerprint (up to 300 sorted unique coordinates), the selected marker subset (1–8 unique in-bounds cells belonging to that footprint), and the consistent one/two/three-beat warning stage. Only NOVA/ECLIPSE_SWEEP may have three beats; the one-beat warning must be final. No new sound voices, buffers, visual pools, draw calls, or persistent collections.
4. [GREEN run 43584230815](https://github.com/my-edutu/Ai_games/actions/runs/43584230815): contracts job passed **332/332 tests** and `npm run build`. The genuine Chrome real-preview job had started but had no verdict at the last inspection.

The helper validates internal coherence of an existing claimed public warning; the live snapshot and authored-owner verification remain with the D04 planner/controller. It is **not** cryptographic provenance, impact evidence, an attacker claim, or a substitute for the authentic capture-chain test.

## Budget, UX and review

- Unchanged: 8 live original-foley voices, one 13,440-sample generated mono noise buffer, 7 retained visual pools, at most 104 GPU instances and 7 additional draw calls, 32 pending and 32 awaiting-frame effects, 64 receipts.
- Unchanged: consent-gated WebAudio, persisted mute, reduced flash/motion, dedupe and stale cue deadline, scene/floor/restart cleanup, renderer receipt, neutral unowned warnings, and the legacy default. D04 stays opt-in via `?feedback=d04`.
- Specification review: one identified source authorization defect corrected; no invented Warden owner or target, no damage promoted from a warning.
- Quality review: validation is bounded to at most 300 footprint tokens and 8 selected markers at discrete warning admission, not per WebGL frame; no new retained state. The public planner still admits some unknown warning shapes for one/two beats, so this validator intentionally does not invent a stricter shape authority rule.

## Real gameplay evidence status and next dominant weakness

The preceding real clips [43574567089 artifact 14105778161](https://github.com/my-edutu/Ai_games/actions/runs/43574567089/artifacts/14105778161) included VP8/Opus desktop 1440 and 390px mobile streams, but only 9 and 10 frames respectively, with 3.294s/3.011s largest frame gaps. These are **genuine but sparse recordings before this patch**, not source-to-sample synchronized proof or three moving viewpoints. No fresh post-change media is certified at this handoff.

Next work: diagnose multi-second WebGL renderer delivery stalls without touching another owner's renderer, then obtain matched three-viewpoint desktop and 390px mobile live Warden warning/release/recovery/earned counter and authentic miss/block/dodge/projectile/spell/HP loss with decoded aligned original-sound tracks and the 20-minute soak. Do not dilute the 400ms submission rule or label static contracts as Diablo-IV parity.

**Rollback:** revert the D04 foley source patch on this branch only if integration uncovers an incompatible genuine public warning; keep the failing counterexample contract for review.
