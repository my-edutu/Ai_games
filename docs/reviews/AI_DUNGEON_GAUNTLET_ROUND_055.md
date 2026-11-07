# AI Dungeon — Gauntlet Round 055: Earthy Crypt Material and Key-Light Grade

**Date:** 2026-11-01. **PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49), branch `feat/ai-dungeon-3d-gauntlet-foundation`. **Keep DRAFT; do not merge.**

**Primary quality bar:** authentic Diablo IV gameplay/screenshots, with No Rest for the Wicked environment composition and Path of Exile 2 combat as supporting reference. **Visual bar NOT MET and production readiness NOT established.**

## Proven defect and limited approach

Read root AGENTS.md, the Round 18 architectural review and Round 54 technical/capture review, existing real WebGL Round 53/54 A/B images, specialist creative direction, game-feel, performance, deterministic simulation, architecture and QA skills, and the live renderer. The actual prior 1440px software-WebGL screenshot shows the crypt scene is overwhelmingly uniform cobalt/blue despite locally warm torches. It also shows stylized overlapping character proportions and unresolved asset quality. A complete original provenance-cleared asset replacement is beyond a verifiable bounded increment with the worker tunnel unavailable. This round instead differentiates the **actual crypt 3D stone from the deliberately blue Obsidian Vault**, without adding assets, draw calls or light instances.

Existing stone walls, floor pavers, cutaway floor backing, near-ground ruins, detail façades, cavern backdrop, existing biome accents and the already-present moon/key and party-fill lights receive complementary earthy mineral tones on floor change. This is real Three.js material and light configuration, **not a CSS filter, static mockup, separate spectator authority or screenshot-only override**. Other biomes preserve their distinct blue, purple and fire-red identities. An exact-scene `stoneGrade` diagnostic reports the actual live PBR material hex values and mapped stone texture.

## Test-first sequence and exact receipt

1. **RED contracts:** [b774f6b](https://github.com/my-edutu/Ai_games/commit/b774f6bea43555df28882670d29c851e7415d42b) adds a genuine generated masonry palette contract and demands real main-scene material regrading plus a live diagnostic. [687309c](https://github.com/my-edutu/Ai_games/commit/687309cc2ecbae1d7e43fb0091edb835d8b7979d) adds a real seeded Chromium/WebGL test using a public state from `DungeonRuntime.step`: checks three loaded textured rigs, actual material/light values, errors and a world-only screenshot.
2. **Confirmed RED, not an infrastructure failure:** [test-only workflow 41291029768, authority job 124802199107](https://github.com/my-edutu/Ai_games/actions/runs/41291029768) shows **141 passed / 1 expected failed of 142 foundation tests** at `687309cc`. The new crypt material contract failed (expected old blue masonry), prior 141 remained green. Browser jobs on that test-only workflow were canceled by the subsequent code push; no browser RED result is invented.
3. **Implementation:** [38e8617](https://github.com/my-edutu/Ai_games/commit/38e8617cd9dd7f5fd34f38b5c7ffb52295d6536c) changes five actual viewer source modules: `wall-masonry-plan.js`, `environment.js`, `biome-atmosphere.js`, `floor-ruins.js` and `app.js`. The first-floor palette becomes warm grey-brown masonry with muted sage accents, while the third floor retains mineral blue. Three.js shared wall/floor/trim materials and pre-existing party fill/moon colours update once per floor build. Existing mesh budgets and game state remain untouched.
4. **GREEN exact implementation checks:** [dedicated authority and 3-shard Chromium run 41291154539](https://github.com/my-edutu/Ai_games/actions/runs/41291154539), [separate real visual workflow 41291154491](https://github.com/my-edutu/Ai_games/actions/runs/41291154491), [catalogue CI 41291154518](https://github.com/my-edutu/Ai_games/actions/runs/41291154518) were launched on `38e8617`. **VERIFIED on reviewed head c25c6895:** dedicated authority job 124803413077 passed **142/142 Dungeon foundation tests**, **18/18 presentation/interface tests** and **24 seeded campaigns × 900 ticks, zero determinism divergences, highest floor 9**. Three genuine Chromium/WebGL shards (jobs 124803413165 / 124803413203 / 124803413212) passed **21/21 + 21/21 + 21/21 = 63/63**, including the new real crypt-grade browser test. The independent real-browser interface workflow 41291440829 passed **10/10**. Catalogue-wide CI 41291440841 remained **IN PROGRESS** at this evidence checkpoint; it is not counted as passed.
5. **Previous stable baseline:** [Round 54](AI_DUNGEON_GAUNTLET_ROUND_054.md) independently recorded **141/141 prior foundation, 18/18 prior UI, 62/62 prior actual Chromium and 24×900 seeded replay zero divergences**, plus inspected actual browser world. Those are **prior head** checks, not validation of this change.

## Exact-code real WebGL proof and measured A/B (not a blinded preference study)

Opened and inspected the real [Round 54 world-only Chromium/WebGL artifact](https://github.com/my-edutu/Ai_games/actions/runs/41287715267/artifacts/13075809413) and [Round 55 raw-world artifact](https://github.com/my-edutu/Ai_games/actions/runs/41291440731/artifacts/13077473096). Both standard world-only screenshots are 1440×832, source actual `DungeonRuntime.create('dungeon-ui-round17')` after 18 steps, and the same live Three.js canvas without HUD. The new separate [real `visual-room-art-18` crypt-grade screenshot](https://github.com/my-edutu/Ai_games/actions/runs/41291440731/artifacts/13077523354) passed material and image gates; [desktop/mobile visual workflow artifact](https://github.com/my-edutu/Ai_games/actions/runs/41291440829/artifacts/13076858846) was also opened. **All three browser shards passed** on review head `c25c6895`, whose only difference from implementation head `38e8617` is this technical review Markdown.

Old-versus-new raw-world metrics (from the screenshots/artifact JSON, not an assumed future quality score):

| Same seed/tick audit | R54 real WebGL | R55 real WebGL |
| --- | ---: | ---: |
| Screenshot size | 1440×832 | 1440×832 |
| Sampled mean luminance /255 | 36.72 | 44.89 |
| Browser coloured fraction | 66.36% | 67.07% |
| Three.js triangles | 105,831 | 105,831 |
| Visible heroes / enemies | 3 / 2 | 3 / 2 |
| Exploratory whole-image warm-dominant pixel share | ~1.0% | ~66.4% |
| Exploratory whole-image blue-dominant pixel share | ~63.7% | ~0.5% |

Warm-pixel classification here is a post-hoc exploratory RGB threshold (lit pixels where R exceeds B by 15 and G by 4); the blue measure mirrors that threshold. The percentages are **not** an artistic fidelity, readability or runtime performance metric. The images prove a strong scene palette shift, not new geometry, physically convincing stone or actual Diablo IV quality. A real viewport critique still rejects the toy/chibi anatomy, crowding, rigid block walls, repeated square pavers, limited combat weight, and broad uniform brown tint replacing broad uniform blue. A second biome (Obsidian) retains its distinct cold palette according to generated texture tests, but there is **no new matched Obsidian gameplay capture in this round**.

## Separate checks

**Specification review (self):** 100% presentation-only; no changes to authority, seeded streams, state, hits, pathfinding, spells, economic effects, save/restore or replay formats. No external downloads or asset-license changes. Reuse existing materials, no extra lights or GPU pipelines. Material colours change on floor transition and render diagnostics observe actual scene properties. Browser test can fail for a regression in existing visuals or texture loading. Reduced-motion and software WebGL continue to use their existing rendering budgets. Rollback on the same draft branch: revert `38e8617`, plus these round-specific tests and ledger if necessary.

**Harsh viewer-quality review (self, not an independent critic):** Colder/warmer palette distinction is a small art-direction experiment, not professional environment composition. The last real screenshot continues to show a rigid rectangular playfield, thick parallel stone courses, near-chibi hero/enemy silhouettes, limited detailed anatomy, short simplistic weapon animations, overly crowded fight framing, and severe prior software renderer stalls. **Two real new Chromium screenshots and the separate desktop/mobile interface captures were inspected**. The exact old/new raw-world captures use the same genuine `dungeon-ui-round17` seed at 18 public simulation ticks: the hue is genuinely warmer and the camera, subject positions and triangle count stay comparable. This only establishes the palette result; it does not prove perceptual realism or FPS. No blind matched Diablo IV A/B, no hardware-GPU p95/p99, no sustained soak, no independent fresh-context critic or ultracode. Worker tunnel unavailable, not simulated.

## Open gate and next blocker

Top blocker after this bounded grade remains **authentic original/provenance-cleared, anatomically sound GLB heroes/enemies with readable weapon-to-target contact, plus measured hardware GPU frame-time tails and memory**. Verify cinematic composition on actual unmodified gameplay clips rather than static diagnostics. Keep the draft PR unmerged; never claim AAA parity or production readiness.
