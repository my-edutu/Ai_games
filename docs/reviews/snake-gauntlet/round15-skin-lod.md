# Round 15 — distance-aware serpent skin shading

Base exact branch `982f925645c530219e6341c09ba9f096dc5d5d3b`; serpent source blob `2563746b1c63e3a7c07cc0a351142915cf74ad34`.

## Highest-impact unmet slice

The fixed official Snake Pass reference still wins on expressive material detail and consistent animation; the unchanged full-HD desktop gate requires >=17 **actual render submissions** in its sample. [Prior exact-head run 41170386701](https://github.com/my-edutu/Ai_games/actions/runs/41170386701) passed 15/16, but submitted only **10 draws in 1006.4ms**, despite ~60.61 RAF callbacks/s. A separate diagnostic in that job, at fixed DPR 0.4 on a minimal page, measured ~31.17 submitted FPS full render versus ~38.15 omitting serpent/contacts; these are not representative comparative production results, but identify substantial dynamic character cost.

## Production candidate

Two pigmented meshes — continuous body and sculpted skull — switch to precreated single-map Lambert shaders at the existing low-detail camera distance. Their **exact original authored color textures** stay in use. Returning to the close character view restores the original full PBR bump and roughness maps, unchanged. Mesh coordinates, expression, portal separation, world camera, snapshots, AI, score, cue/caption channels, reduced motion, fallback, shader cache and bounded GPU queue are untouched. The two alternative materials allocate only on creation, not per frame.

The new `tests/phase3/snake-skin-lod.test.cjs` exercises 120 overview/detail transitions, original pigment identity, high-resolution relief restoration, portal discontinuity indexing, empty state and unchanged resource budgets.

## Review limitations and follow-up

Self-review only: the diffuse overview may lose some highlight definition, although this is subpixel at broadcast camera scale. The existing exact-head browser test automatically captures real overview, character, portrait and motion images; **new candidate capture and CI results are pending as of this commit**. No throughput win, original-Snake-Pass parity or independent critic is claimed. The specialist workspace tunnel is offline, so no independent verdict was fabricated. Performance and whole-game quality gates stay OPEN. Revert these two alternate material constructors and the detail switch to roll back. Never merge/deploy; keep PR draft.

## Verified exact-source runtime evidence — after publishing `2e4fe40`

- **Full general CI** [run 41171326786](https://github.com/my-edutu/Ai_games/actions/runs/41171326786): TypeScript build, all **542/542** Node tests (0 failed/skipped), four stream-host self-tests, nondeterminism scan, chaos/operations/release validations **passed**. Browser stage **27/28 passed** and failed the unchanged **desktop actual-submission pacing gate**: **10 actual draws / 1004.9ms** vs minimum **17**. Overall workflow is **FAILURE**, not green.
- **Focused real-browser CI** [run 41171326788](https://github.com/my-edutu/Ai_games/actions/runs/41171326788): **15/16 passed**. The sole failure is pacing: **10 actual draw submissions / 1015.0ms (~9.85 submitted FPS)** against at least 17. The independent ~60.10 RAF callbacks/s are not render FPS or display-present FPS. The browser retained an active world cache (27 hits, 3 builds), 14 WebGL textures, 20 owned serpent geometries, 14 serpent materials including two new preallocated shading LODs and no WebGL error in the diagnostic profiles.
- [Exact-head screenshots and trace (artifact 13031152958)](https://github.com/my-edutu/Ai_games/actions/runs/41171326788/artifacts/13031152958) · [18.48-second live gameplay motion (artifact 13030759114)](https://github.com/my-edutu/Ai_games/actions/runs/41171326788/artifacts/13030759114) · [metrics (artifact 13031297210)](https://github.com/my-edutu/Ai_games/actions/runs/41171326788/artifacts/13031297210). These were **downloaded and inspected**, including 1440×1200 detail, 390×844 portrait, and 960×640 matched frozen replay, not concept art.
- Matched frozen real browser cache PNG: prior `982f925` [run 41170386701](https://github.com/my-edutu/Ai_games/actions/runs/41170386701), artifact 13030936791, screenshot SHA256 `e145c5958edd92242cf383208ae0323f8c11bb7efc9443406a251f898bbcbef8`; candidate `2e4fe40`, artifact 13031152958, screenshot SHA256 `575be1800813a76f562995ea589959588aa447794f7728adf28fbcd2553c11b4`. At identical 960×640 replay: mean absolute 8-bit RGB-channel pixel difference **0.0843**; **1.912%** of pixels differ in at least one channel; only **0.840%** have a channel delta >8. This establishes a near-identical **frozen overview still**, not preserved motion/visual quality in every camera or an FPS gain.
- **No performance win shown:** focused actual submissions were 10 before and 10 after. Frozen fixed-ratio diagnostic rates varied with CI load (prior minimal page ~31.17 submitted FPS vs candidate ~26.11) and are explicitly **not** causal. The shader now skips overview bump/roughness maps but bottlenecks remain.

### Self-review against the fixed reference

Official [Snake Pass](https://store.steampowered.com/app/544330/Snake_Pass/) still outclasses this exact-head real detail/overview/portrait capture: the broad smooth muzzle and lifted eye rims remain frog-like, the square pale court dominates the composition versus organically worn, moss-laden stone, and opaque dark water and distant groves lack the reference's vibrant material layers, water clarity, and staging. ASTRO BOT remains a secondary environmental craft reference, not borrowed imagery. In actual recorded motion the live snake remains understandable and visually connected, but held/submitted frames still fail the motion smoothness bar.

**Verdict: SELF-REVIEW LOSE, no fresh independent reviewer available** (shared worker tunnel offline). Keep Round15 shader candidate as a low-risk bounded alternative without asserting commercial visual parity, real-device smoothness, or R5 readiness. The unchanged pacing, independent character/world/motion verdict and production/soak remain open. The branch stays draft/unmerged/undeployed.
