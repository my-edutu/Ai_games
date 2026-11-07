# PR68 — diagonal and moving-wall source contact truth
2026-11-07 · P0 OPEN · transformation verdict **NOT EVALUATED**

## Source and defect
- Frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9` (never edited).
- Starting PR68 HEAD: `813b3e148a2c18630b2d8e9b1fb6f108837c1ccc`; implementation: `691b2d86b87e2b3123e871f9a3465e378c8b7bfc`; safe-integer follow-up: `1468ba010794598b1305d58e8b73230a23ae69e9`.
- The prior source side solver used only the player's **start-of-tick height**. During a real 17k-unit lateral burst plus ascent/descent, the body could cross a solid wall face **after** crossing its roof/underside. Horizontal collision was missed and the subsequent vertical solver could accept a false landing/head contact at the endpoint. This is a source-model defect; it has **not** been observed in current normal-speed film.

## Cohesive fix
- `src/physics/swept-wall-contact.ts` computes X crossing time from the authoritative tick/tick+1 moving-deck faces, checks the actual interpolated body-height overlap at that time, and chooses a physically non-penetrating integer stop. A wall moving into a stationary exposed body can now push it; a receding wall does not drag it.
- `src/physics/step.ts` resolves the earliest actual 2-D wall side collision across candidate solids. Existing vertical top/underside, platform-carry, guardian seal, hazard, damage and floor progression logic are preserved.
- `tests/phase2/tower-live-swept-contact.test.cjs` adds authentic original-runtime cases for false corner landing, earned top landing, false underside catch, earned head contact, moving-face push, and fractional contact integrity. Historical/unflagged side loop remains unchanged.
- This is a physical collision/landing integrity correction, **not** a visual or full-game transformation. It has no secret forecasting, scripted win, teleport or artificially acquired floor clearance.

## Evidence and execution
- Six isolated local Node22 pure fixed-step contact probes passed, plus one opposing moving-face safe-integer probe. These independently reproduce the helper arithmetic; they are **not** a checked-out package test, actual gameplay, frame-time measurement or browser capture.
- Original `npm run build` / `npm run test:tower:phase2`, 2×3,200-tick campaigns and 960×600/390×844 normal-speed videos: **NOT EVALUATED**. Development workspace connector returned `Tunnel-client has not been seen for 300 seconds`; local `git ls-remote` failed on `Could not resolve host: github.com`.
- Implementation-source [nine-job gameplay capture](https://github.com/my-edutu/Ai_games/actions/runs/42360524651): queued, no verified artifacts at inspection. [Exact-source quality](https://github.com/my-edutu/Ai_games/actions/runs/42360524547): queued. Neither can be counted as a gameplay pass.
- Historical pre-change candidate portrait video: 132.80s, 390×844, 25 fps. Actual still samples in its first minute show floor 10, then 8, then 9, then 10 rather than a single matched guardian/crusher defeat → unlocked walkable gateway → floor nine onward → outcome/restart. Hero scale varies widely. This footage is historical, **not** evidence of current implementation.
- Independent randomized anonymous critics: LOOKS 0/5, FEELS 0/5, PLAYS 0/5. Actual supported-device memory and p50/p95/p99: **NOT EVALUATED**. Transformation verdict **NOT EVALUATED**.

## Review — spec compliance and engineering critique
- **Specification:** only opted-in original Tower source, preserved frozen `transformation.json.baseline.sha`; no edits to PR58 or other games; all physics changes source-driven and deterministic for fixed integer state. Existing replay checksums for the unflagged historical path remain protected by the opt-in gate.
- **Engineering risk:** the new helper uses floating-point interpolation internally but rounds the resulting contact point **away from penetration** to satisfy authoritative integer-integrity constraints. Moving walls may push into adjacent geometry; multi-contact simultaneous corner resolution and high-speed moving-deck full-run behavior still require original-runtime tests and film. No claim of replay/device safety without execution.
- **Performance:** an O(n) candidate solid scan plus lookup of existing tick/tick+1 platform poses, bounded by source chunk size. Actual GPU/CPU p50/p95/p99 and memory have **not** been measured.
- **UX/accessibility/audio:** no HUD, keyboard, screen reader, audio, render assets or camera settings altered; any visible improvement in foot contact and action legibility is a hypothesis until inspected at normal speed on both viewports.
- **Security/privacy/recovery:** no new network, telemetry, storage or permissions. Existing technical-integrity quarantine and lifecycle/restart remain authoritative. Test collision shutdown and restart in real campaigns.
- **Rollout:** keep on existing open DRAFT PR68 only; no deployment, no merge, no force-push or baseline movement. Roll back only the three Tower-source/test files in a normal PR68 commit if evidence finds regressions, never rewrite PR58 or history.

## Next P0 action
Restore an authenticated Node22+Chromium checkout or functioning GitHub runner; execute npm run test:tower:phase2 (especially six added swept-side/corner regressions), both unchanged 3200-tick campaigns, then inspect exact immutable-source baseline/candidate 960x600 + 390x844 normal-speed ≥60s clips and event alignment. Correct largest observed playable/visual defect, then independently assess LOOKS/FEELS/PLAYS and actual-device frame p50/p95/p99/memory before stage advance.
