# Game 2 — pass 30 actual-source rendered review (2026-11-01)

**Verdict: local key-bow visibility improved against pass 29; fixed Captain Toad bar NOT PASSED.** This is the lead's direct original-screenshot inspection, **not** a fresh-context independent or blind A/B critic. Do not conflate code/test success with visual quality.

## Provenance and objective disclosure

- Current gameplay source: `51e1e43d3d3565aaf1fa93e5f31c8a91db8b88b7`, connected-wrist source `1a6fe8a`, strict-reset fix `51e1e43`, prior pose assertions `f1da826`. **Actual browser captures**: [Actions run 41257731828](https://github.com/my-edutu/Ai_games/actions/runs/41257731828), [original Maze Phase 3 ZIP artifact 13064406479](https://github.com/my-edutu/Ai_games/actions/runs/41257731828/artifacts/13064406479).
- Desktop: `sealed-gate.png`, 1280×900, captured **2026-11-01T00:44:18.834Z**, original PNG SHA-256 `f73f83514eb2e19eb271452d76eb82faae018a7f46f2ac19f65d425457fcb226`.
- Portrait: `sealed-gate-portrait.png`, native 390×844, captured **2026-11-01T00:44:20.684Z**, original PNG SHA-256 `760c0a0487662020e4ea5a8538eea97153baf3bc2c6e58eb211ef2d8c4140306`.
- Both SHA-256 values were independently recomputed from unmodified ZIP bytes and exactly match adjacent `sealed-gate.json` / `sealed-gate-portrait.json` `imageSha256` fields; decoded dimensions agree. Manifest source maps: `app.js` `290b3cd4…`, `scene.js` `b0b04c1a…`, `map-view.mjs` `96cd28c2…`, `world.js` `e373baed…`. The captured frame is **seed `maze-visual-reference-13`, tick 21, legitimately known still-closed `door-2`, exact carried matching key**, public `keyLockCloseup=true`. No fabricated unlock, secret path or altered authority.

## Genuine image-to-image inspection

- Compared to original pass29 artifact `13059797608` at the **identical seed/tick and gate state**, pass30 exposes more of the mint ring on the camera side of the sandstone lintel. The edited geometry is limited to a true modeled elbow counter-turn, not a detached overlay; key/lock remain genuine 3D objects.
- Exact PNG RGB difference mask (any channel >12): **0.1456% of desktop pixels** and **0.2628% of native portrait pixels**, bounded to desktop x354–420/y367–429 and portrait x134–181/y270–314. Those are *edit extents*, not visual grades or benchmark scores.
- At native portrait scale, the **gold blade and the hand-to-key-to-recess relationship are still not immediately obvious**. The mint bow appears above the stone lintel while the recessed keyhole sits much lower on the outer stile. The upper-right arch still clips; a broad empty lagoon occupies too much of the available 3D game window. The mobile UI below the scene also competes for vertical space. Enlarged crops may help diagnosis but **native-size legibility is the acceptance bar**.
- Against the two unchanged SHA-pinned official [Nintendo Captain Toad gameplay references](./reference-manifest.json), this is not a win. Nintendo still has stronger miniature-stage readability, architectural storytelling and readable environmental interactions. Luigi's Mansion 3 and ASTRO BOT remain secondary references, not substitute bars.

## Functional verification and environmental limits

- [Exact-head CI 41257731828](https://github.com/my-edutu/Ai_games/actions/runs/41257731828) **FAILED overall**: build and Node tests, Maze/other stream self-tests, deterministic scan, real browser evidence generation and upload all passed; Playwright browser tests **104 passed, 3 failed**, all Tiny Kingdom G057 plaster/G058 grass/G063 river optics source expectations. No Maze browser test failed. These are real other-game regressions; do not weaken assertions or describe the suite as green.
- `frameP50Ms≈183.3` from the desktop screenshot diagnostic is **CPU-throttled software Chromium rendering**, not hardware GPU FPS and not evidence of a product performance defect.
- Remote shared workspace `exec_command` returned `Tunnel-client has not been seen for 300 seconds`; separate fresh-context builder/critic agents and Ultracode could not run. **No independent blind A/B verdict**, actual hardware-GPU FPS or benchmark victory is asserted.

## Next smallest independently judgeable Gauntlet slices

1. **Physical contact/readability (highest priority):** one source-only geometry/pose slice should ensure a continuous visible glove→shaft→mint bow at native 390×844, unobscured by the public gate lintel. The lock must stay on the genuinely blocked stile; no inserted key, unlocked animation, hint to a hidden passage or authority transition. Compare real same-seed source-bound desktop/portrait frames with pass30; reject if connection is unclear or the key projects below Pip's helmet.
2. **Camera and architecture:** a separate slice preserves the whole observed upper arch and Pip's lock interaction without removing useful near-stage context or increasing empty lagoon. Judge native 390×844 and 1280×900 full frames, not crops.
3. **Environmental storytelling:** a separate slice improves visible occupied platform/readable landmarks and material differentiation using only disclosed cells and deterministic coordinate-based decoration. Verify no undisclosed topology or gameplay obstruction was introduced.
4. For each candidate, a **fresh-context builder** and **separate critic** must inspect dated unchanged production PNGs alongside both frozen reference JPEGs; blind-label candidate vs prior when possible. Source/privacy/replay critics must independently check known-gate and character rules. If the reference wins, feed the largest mismatch into the next slice. Do not lower the bar for green tests.

**Release gate: FAILED. Draft PR #53 stays unmerged, undeployed and active.**
