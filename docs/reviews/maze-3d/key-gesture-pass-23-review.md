# Game 2 Gauntlet — pass 23: real carried-key gesture at a disclosed sealed gate

**2026-10-31. Exact gameplay-source CI PASSED; actual desktop/portrait output inspected; fixed Captain Toad benchmark NOT PASSED.** The PR stays draft, unmerged and undeployed.

## Small independently judgeable slices

1. **Public trigger:** [source commit 1e8948d](https://github.com/my-edutu/Ai_games/commit/1e8948daa9b1d120a5a980b41fd5929d880be881) adds `publicCarriedGateCue`. It requires a real currently disclosed closed gate near Pip's *actual rendered* pose, the exact `requiredKeyId` in public inventory, and a bounded distance; open, hidden, unrelated, distant and terminal states produce no cue. No private map, pathfinding, changed rules or movement authority.
2. **Original actor performance:** Pip turns head and torso and extends the left glove to the real lock, presenting a reusable mint key mesh. The gesture is cosmetic, mutually exclusive with nearby disclosed threat attention and terminal reactions, and readable as a static pose in reduced-motion settings. No per-frame geometry/material allocations; balanced and full rigs retain lifecycle cleanup.
3. **Regression/repair:** New unit tests check exact-key vs unrelated, open and hidden gates, immutable snapshots, modeled glove key, neutral clear, threat precedence, terminal poses and both character detail levels. The initial [CI 41198794677](https://github.com/my-edutu/Ai_games/actions/runs/41198794677) **FAILED 2 of 526 Node tests** because the absent `keyHeading` leaked `0 * NaN` into neutral and guardian head rotations. This was a genuine implementation defect, not hardware throttling. [Fix aaf96f3](https://github.com/my-edutu/Ai_games/commit/aaf96f36268149b1d74611e5dfd90b381540242d) explicitly guards the zero-strength case. No relaxed tests.
4. **Real scene evidence:** [Exact-source CI 41199011079](https://github.com/my-edutu/Ai_games/actions/runs/41199011079) at fixed gameplay SHA `aaf96f36268149b1d74611e5dfd90b381540242d` PASSED **526/526 Node tests and 25/25 browser checks**, build, four stream-host self-tests, determinism scan, plus original WebGL captures. [Original GitHub artifact 13041484155](https://github.com/my-edutu/Ai_games/actions/runs/41199011079/artifacts/13041484155) carries the real PNGs and signed manifests.

## Same-state actual-render comparison (no fabricated actor or gate)

Both runs replayed production seed `maze-visual-reference-13`, public tick **21**, genuinely disclosed closed `door-2` between known cells 17 and 34. The tests used the real sanitized MazeRuntime frame and the actual production browser on 1280×900 desktop and 390×844 portrait, with reduced motion. Original PNG SHA-256 values were recomputed from each CI ZIP and matched the adjacent manifests.

| Capture | Pass 22 | Pass 23 (this source) |
| --- | --- | --- |
| Desktop UTC | 2026-10-31 11:35:54.061 | **2026-10-31 12:04:51.888** |
| Desktop image SHA-256 | `b6012dba20c0227ee0048dcdd31eac7f224f952c08bf86904889286bc75aba5b` | **`80209adb5eec1a7b99755c4ae73513e151dc8c776e0eceece69f278e8eebab38`** |
| Portrait UTC | 2026-10-31 11:35:56.592 | **2026-10-31 12:04:55.569** |
| Portrait image SHA-256 | `23bf59973f46c9c242e9fe8ce8480b56b2538eb61d226dd591c11b7e942deab7` | **`a95676e71b8273f7088e95fb13b9b2cff9929c16e6f8223cd643ca1aeb726c64`** |
| Actual desktop gate/Pip normalized X | -0.434858 / -0.287675 | **identical** |
| Actual portrait gate/Pip normalized X | -0.489144 / -0.230030 | **identical** |

The new desktop `map-view.mjs` SHA-256 is `15293927f12ba6cbc5bbfab0c8bfa761f23a60ef6a44d80bead16c8f1082731f`, and `scene.js` is `1a2cba4406a615329e5b2cd9ccac15712ea5e308401b82d365f33ebb4cb8a4ac`, per its original CI manifest. `world.js` is unchanged from pass 22. Its screenshot manifest does not separately hash `characters.js`; the exact CI run commit and repository source remain authoritative.

**Lead-only observed image verdict:** Pip's gaze/upper body now turn visibly toward the blocked gate. The physical key presentation is **partly occluded** by foreground masonry and does not yet explain the key-to-lock action instantly at native gameplay scale, especially on 390px portrait. The actual 1280×900 screenshot differs from pass 22 by only **0.411% of gameplay pixels** over threshold 10/255 in at least one channel (fixed gameplay crop x30..977,y99..815), concentrated around Pip. This is a localization check, not an artistic score. The compositional water/left-bias and tiny character+gate remain unchanged. **Nintendo's fixed Captain Toad imagery still wins** in expressive causal storytelling, focal-scale composition, and readable obstacle/prop interaction.

## Capability, truth and performance gates

- A separate fresh-context builder/critic, independent blind A/B and Ultracode were **unavailable**: the shared-workspace command and subagent roster both responded `Tunnel-client has not been seen for 300 seconds`. The visual comparison above is performed by the lead on *actual PNGs*, not misrepresented as independent judgment.
- This is presentation-only. Authority, replay, deterministic AI, route legality, hidden objects, and result conditions were unchanged. The tests and actual captures guard the public-source boundary, but do not establish full readiness.
- CI used CPU-throttled software WebGL; its pass-23 desktop frame P50 in the manifest (383.3ms vs prior 216.7ms) is **not** a valid GPU/hardware FPS comparison or proof the candidate degraded product performance. No repeated inconclusive heavy benchmark was run.
- **Next independently judgeable gap:** make the key visibly clear of the foreground gate lintel in both actual desktop and portrait frames, while retaining hand-to-object continuity and respecting actual closed-gate authority; then critique fresh same-seed screenshots, stage alternatives, and fixed Nintendo frames with separate reviewers once available. Do not call benchmark victory from tests.

