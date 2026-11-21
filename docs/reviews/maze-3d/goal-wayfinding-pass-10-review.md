# Tenth-pass observed-goal wayfinding — authentic browser evidence

**Captured:** 2026-10-31T01:45:30.284Z (UTC). **Gameplay source:** `735d8352fcd2f36694b21670c4d41ac57f6faa0e`. **Branch:** `feat/maze-3d-gauntlet`. [Draft PR #53](https://github.com/my-edutu/Ai_games/pull/53). **Fixed benchmark:** the two unchanged Nintendo Captain Toad 1280×720 frames pinned by SHA-256 in [reference-manifest.json](./reference-manifest.json). Supporting quality bars: Luigi's Mansion 3, ASTRO BOT. **Verdict: NOT PASSED.**

## Independent judgeable pieces

1. **Real discovered goal:** `publicObjective(snapshot)` BFS traverses only already-public known, reciprocal, adjacent, unblocked and door-open cells; it never guesses private maze data. It picks one actual observed reachable key or exit. A reachable connection is explicitly **not safe**.
2. **A legal first step:** `firstStep` is the initial neighbor on that same public BFS, not the AI's policy command; no path is inferred through undisclosed or locked passages.
3. **Distinct visual semantics:** amber low-profile goal glyph for known key, mint for known exit, turquoise for current public AI planned step; white for other known local choices. A goal arrow may also be a planned step but remains correctly labeled in public diagnostics.
4. **Visual legibility:** slightly stronger beacon within two known passages; floor glyph reused with no new dynamic light; neutral/terminal states suppress markers. No authoritative simulation, deterministic rule or privacy boundary changed.

## Source-bound actual images, not mockups

- [Current final-source CI browser artifact](https://github.com/my-edutu/Ai_games/actions/runs/41156437915/artifacts/13025591289): `observed-landmark.png` 1280×900, production seed `maze-visual-reference-13`, tick **26**, known exit cell **69**, one public passage away; `objectiveInFrame=true`. Byte-verified image SHA-256 `ca2faf27d9abc369a68af0a42ec05f28b195b286929969fadb6da154d3f3829e`. Its dated JSON pins `app.js`, `map-view.mjs`, `scene.js` and `world.js` source hashes.
- [Pre-change same-seed frame](https://github.com/my-edutu/Ai_games/actions/runs/41155282374/artifacts/13024887669): same production seed/tick, `observed-landmark.png` SHA-256 `54ef5abe89fef5a6d7a1ba524d42518ecd247b1f3e67cf71593abd2bd9bb8ff4`; parent baseline passed all 520 Node and 25 browser tests at [CI 41155282374](https://github.com/my-edutu/Ai_games/actions/runs/41155282374).
- Strict aligned comparison: **0.2687%** changed RGB positions; this merely locates renderer changes and does **not** measure perceived quality or prove benchmark parity. The current mint public exit cue is discernible next to Pip/portal on the actual screenshot.

## Direct native-size lead observation vs fixed bar

Pip stands on a raised ruin balcony beside an actual discovered cyan exit. The mint first-step cue explains how a **known public connection** can head toward the exit. However, the beacon ring overlays the already modeled exit silhouette, Pip remains small in the ~950px scene, and the large water/ruin composition has weaker unique character/goal storytelling than the fixed Nintendo dioramas. The test frame cannot show a refuge or guarantee a threat-free route and must not pretend to do so. **Nintendo remains the stronger reference.** No independent blind A/B was completed; earlier independent fourth-pass critics still preferred Nintendo.

## Engineering evidence and limitation

[Autonomous Games CI 41156437915](https://github.com/my-edutu/Ai_games/actions/runs/41156437915) ran on final gameplay SHA `735d8352fcd2f36694b21670c4d41ac57f6faa0e`. **521/521 Node tests** passed along with build, host self-tests, deterministic scan, evidence generation; **24/25 browser tests** passed. The single desktop test requires tick progression in exactly 600ms and saw `155 → 155` under CI shared software-rendering contention. It is an actual failing test and requires verification; neither automatically classify as a product defect nor dismiss without reproduction. No timing assertion, production policy, hidden-information boundary or Nintendo visual bar was relaxed. Same-source Eko Phase 2/3/4 workflows passed. `frameP50Ms=299.9` is only CPU-throttled software-WebGL instrumentation, not representative hardware FPS.

The shared workspace command and subagent status calls again failed (`Tunnel-client has not been seen for 300 seconds`). Fresh separate builder/critic workers, Ultracode, independent source-blinded scoring, live hardware and audio were unavailable; these remain explicitly **OPEN**.

## Next critic tasks

A fresh critic must inspect the **actual** current/native screenshot and the exact pinned two Nintendo frames, with versions masked if possible: identify the explorer, perceived objective, lawful observed first move, whether safety is mistakenly implied, and the largest remaining gap. Builder then makes one narrow fix (likely exit-beacon overlap and readable hero-to-objective staging), captures authentic same-seed output, and hands it to a separate blind critic. Also capture a closed-gate and a key scene; verify the 600ms tick failure without faking a software-performance verdict. No merge or deploy.
