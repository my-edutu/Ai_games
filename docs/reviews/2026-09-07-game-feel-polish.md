# Tower + Maze game-feel review — 2026-09-07

Scope: `my-edutu/Ai_games`, based on main `9d23c343675157269a2418b655961f65e9ae41cb`. This pass changes the two integrated public games, not unrelated game branches or AI/ML projects.

## Findings and fixes

| Finding | Evidence in the previous implementation | Correction |
|---|---|---|
| Tower camera loses the climber above floor zero | `transform` subtracted `chunkBaseY` from the camera but not from geometry. A 650px-tall fixture projected its player to y=-1340.76 instead of y=416. | Absolute world coordinates throughout; regression fixtures include floors 0, 1, 2 and 50 and camera y=0. |
| Moving platforms were visibly disconnected from physics | Physics calls `platformAtTick`; the public snapshot exported base platform x/y. | Snapshot uses that same helper at its own tick. No physics parameters, collision rules, replay authority or saves changed. |
| Maze trails could imply impossible shortcuts | Filtering hidden cells before connecting the remaining points bridged gaps. | Bounded segments preserve breaks and require adjacent, mutually known, unblocked corridors without a closed door. |
| Polling made entities visibly snap | Renderers drew newly received positions directly. | Tower interpolates confirmed entity/platform transforms; Maze interpolates only one confirmed neighboring-cell step. No extrapolation or guessed multi-cell movement. |
| Generic shapes and weak feedback | Most objects were undifferentiated rectangles/circles. | Armoured climber, distinct hostile silhouettes, guardian telegraph, pickup symbols, moving-platform chevrons, shield outline, bounded landing/damage rings; Maze explorer, key, drone, trap, checkpoint and exit symbols. |
| Important cards were placeholders | Tower result stayed at 0m; upgrade offers were not rendered; scene updates were tied to snapshot checksum changes. | Actual height, offer names and scene-only transitions populate the cards. |
| Mobile layouts wasted space or hid context | Conflicting CSS layers; narrow Maze columns; Tower status disappeared. | One loaded, self-contained stylesheet per game, portrait Tower health/intent shelf, seven-column local Maze framing, and full-canvas clean feed. |
| Recovery/lifecycle gaps | Tower had no request timeout; page lifecycle did not reliably stop/resume presentation loops. | Single in-flight polling, 2.5s timeout, stale-frame rejection, last-confirmed-frame recovery copy, pagehide cancellation/pageshow restart. |

## Presentation boundaries and budgets

The simulation remains server-authoritative and fixed-step. Neither renderer changes health, position, scoring, difficulty, RNG, collision or AI decisions. Rendering consumes public snapshots only. Maze rendering never uses hidden walls, hidden exit coordinates or private seeds. Only already-public neighboring cells are eligible for smooth motion.

Tower retains two frames, caps feedback rings at 24 with a 500ms lifetime, and clamps interpolation to the received interval. Run changes, floor changes, rewinds, large jumps, stalled reception and terminal/recovery scenes snap instead. Maze trails remain capped at 240 cells; topology is cached per snapshot, invalidated on resize. Device pixel ratio is capped at 2. There is no full-screen flash or camera shake. OS and explicit reduced-motion preferences suppress motion; high-contrast and clean-feed modes remain available.

HUD copy distinguishes public-feed connection from proof that the remote simulation is healthy. Maze's counter is labeled **TICKS LEFT**, not seconds; the bounded route count is labeled **RECENT STEPS**. Technical tower ticks remain available to existing tests without dominating the broadcast.

## Verification actually performed locally

- 22 rendering/path tests passed with `node --test tests/phase3/game-feel-regression.test.cjs`.
- 10 platform projection tests passed with `node --test tests/phase3/tower-platform-render.test.cjs`. The actual generator, motion helper, checksum and snapshot modules were transpiled locally with the available TypeScript toolchain. The four unchanged supporting source files and the original snapshot were hash-checked against GitHub. This was **not a full repository typecheck**.
- Red-to-green evidence: the original camera failed the high-floor projection; all ten original platform cases failed; missing pure APIs initially failed; phone-health visibility and Maze framing checks failed before their corrections.
- Chromium fixture checks: desktop 1440×900, portrait 390×844, landscape 844×390, OS reduced motion plus high contrast, and full-canvas clean feed for both games; plus scene/stale/recovery/page-lifecycle sequences. **12 grouped checks passed, zero JavaScript page errors.** Screenshots were visually inspected.
- Local browser navigation and network access were restricted. These captures loaded the exact app source into isolated Chromium documents with public-frame fixtures and substituted fetch/query inputs. They are not live game-host, OBS, production-performance or soak evidence.
- A repository Playwright regression spec additionally covers portrait HUD/framing, stale/recovery behavior and scene-only Tower cards against the real stream hosts with pinned public responses. Its execution, the full TypeScript build, existing suite and release validators require the repository CI toolchain. Do not infer their outcome from the local targeted results.

## Separate quality review

Checked retained DOM IDs/test IDs, public-state globals, static-host asset allowlists, reduced-motion behavior, clean-feed geometry, source-to-physics coordinate agreement, no snapshot mutation, bounded trails/feedback, and safe text rendering with `textContent`. Existing live stream specs remain unchanged. Legacy `styles.css` files remain in the repository for rollback but are no longer loaded alongside the replacement UX stylesheet.

## Remaining work, deliberately not represented as complete

This is a tested polish increment, not a claim of AAA visual quality or production readiness. Existing audio output, adaptive music, authored sprite/animation assets, replay highlights, guardian-specific attack choreography, progression variety and measured viewer-retention experiments warrant separate work. So do real-device/OBS capture, low-bitrate legibility review, long-running memory/performance profiling, multi-seed difficulty balancing and extended soak/canary runs. None of those outcomes is claimed here.

Rollback: revert this cohesive polish commit/PR. No migrations or saved-state conversions are necessary because authoritative rules and persistence schemas are unchanged.
