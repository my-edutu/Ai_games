# PR68 — source-first high-speed collision and real landing truth (2026-11-07)

**Stage:** P0 EVIDENCE + GAME-LOOP TRUTH — OPEN.  
**Leading transformation assessor:** **NOT EVALUATED**.

## Source defect, not a filmed claim

At the inspected PR68 source HEAD `b49b6ba2f4b0b07556910a14de260d98997aad67`, `stepTowerPhysics` visits solid platforms sorted by **entity ID**, not nearest contact distance. A live 17,000-unit-per-tick dash can reach *two solid faces in one 50ms step*. Once the loop picks the ID-first **farther** wall, it zeroes horizontal velocity and never tests the nearer face. The climber ends that tick on the wrong side of the nearer physical obstruction. This is a real collision-integrity defect, with consequences for action readability and gameplay truth during fast ascents, moving-deck danger and guardian approach; **not** evidence from a current full-play video.

## Implemented on PR68 only

- `games/infinite-tower-climb/src/physics/step.ts`: the fully opted-in live guardian mode now compares *all actual next-step solid walls* against the same previous-to-proposed body sweep, selects the nearest physical blocker by travel direction, clamps once, and emits **one** truthful wall contact. Real velocity, movement bounds, platform generation, gravity, jump, stamina and the source guardian-seal collision still own the resulting state. No synthetic landing, position skip, saved replay, or renderer-side authority.
- The existing vertical contact solver was reviewed: its updated `newY` already selects the nearer deck when two tops are crossed. A proposed rewrite was **reverted** rather than carrying unnecessary risk. Vertical gameplay and historical/unflagged collision order remain unchanged.
- `tests/phase2/tower-live-swept-contact.test.cjs`: original-runtime regression scenarios for opposite high-speed wall approaches, falling across two stacked deck tops, rising across two solid undersides, source immutability, and historical mode preservation.

**Relevant source/test commits:** `8cdbdea17933386a4f82c5a314887b88bba8cafd` (initial swept resolution), `f87341bfe7dcec684c351e357f6c82d419030bd4` (scoped source-only correction), `29998fea445868d38d8daddaf005ce430e7fb140` (right/left and deck fixtures). This is code and test coverage, **not** a transformation gate win.

## Actual verification

The four left/right live/legacy cases were executed in V8 against the **current fetched source horizontal-collision loop**, stripping only the TypeScript type declaration required to execute that selected snippet:

| 50ms swept case | Live selected X/contact | Historical selected X/contact |
| --- | --- | --- |
| Right, far wall ID first | `261000` / near | `266000` / far |
| Left, far wall ID first | `294000` / near | `289000` / far |

**Isolated extracted-source checks: 4/4 PASS.** The expected strict left/right body geometry is tested. The committed original-runtime Node tests, `npm run build`, real campaigns, deterministic replay, browser, WebGL, performance and accessibility **DID NOT RUN**: the connected development tunnel reports `Tunnel-client has not been seen for 300 seconds`; `git ls-remote` from the container fails DNS resolution for `github.com`. This limits verification and is not a gameplay PASS.

GitHub Actions source capture at [42356178011](https://github.com/my-edutu/Ai_games/actions/runs/42356178011) was **queued** for implementation `f87341bf`; exact-head [quality at 42356250570](https://github.com/my-edutu/Ai_games/actions/runs/42356250570) was also **queued** with no result when inspected. Historical recordings remain earlier source; no matched current-candidate normal-speed capture is accepted. Running source code through an isolated V8 case does not substitute for the nine authentic capture jobs.

## Separate spec and quality review

- **Spec:** Source-only first-wall selection is deterministic and uses observed current/next platform geometry, not a helper simulation or a future platform oracle. Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` and PR58 are unchanged. PR68 remains OPEN/DRAFT.
- **Quality:** The first-contact change corrects a high-speed movement integrity hole across both travel directions. It is not yet shown to improve feel or visual clarity. Timing/AI reaction to stopping against a solid face and the unmodified vertical solver must be watched in real recorded play; the current camera may still render a tiny portrait climber. No claims of guardian victory, portal crossing, floor-nine onward, outcome/restart or superiority are made.
- **Privacy/operability:** No new output endpoint, assets, data collection, RNG or secrets. Determinism is expected from integer comparisons but original replay checks are unexecuted. Rollback can revert the scoped physics change without modifying baseline/PR58.

**Independent blind critiques:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5. **Device p50/p95/p99/memory:** NOT EVALUATED.

## Next single highest-impact action

Restore an authenticated Node22 + browser runner; run this new original-runtime fixture and two unchanged 3,200-tick campaigns on exact immutable source commits. Inspect both normal-speed 960×600 desktop and 390×844 portrait streams for physical wall arrival, true moving-platform landing, crusher/guardian defeat, visible gateway opening, a **grounded** body-through-door crossing, floor-nine traversal, game outcome and restart. Diagnose the first genuine gameplay/film blocker, not a green test-count summary. Keep P0 open until the complete loop and recording acceptance exist; no blind reviews or device performance claims without real evidence.
