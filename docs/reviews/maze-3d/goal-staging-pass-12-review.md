# Twelfth-pass camera composition — verified actual render; independent verdict pending

Source [5395d5f](https://github.com/my-edutu/Ai_games/commit/5395d5f66a0104dc60d693e7e93a696e53c68ded) on `feat/maze-3d-gauntlet`. Fixed bar: original exact Nintendo Captain Toad references in [reference-manifest.json](./reference-manifest.json); never swap them. **Benchmark NOT PASSED.**

## Critic's last genuine observation

The actual pass-eleven `observed-landmark.png` in [CI artifact 13026233263](https://github.com/my-edutu/Ai_games/actions/runs/41157967040/artifacts/13026233263) was captured at **2026-10-31T02:07:46.806Z**, 1280×900, seed `maze-visual-reference-13`, tick 26, disclosed exit cell 69, SHA-256 `4f00eca791ef87e343008e4f781e809c58342220a511254d371521d6fb549998`. Pip and the arch became larger, but the left screen contained too much sea while right-side architecture was cropped. The lead's simple native-size color-classification baseline estimates about **44.6% water-colored pixels** within the 946×715 game viewport, versus about **38.9%** in pass ten, using the *same rough color mask*; this is not a perceptual score or independent critic.

## Small implementation and truth constraints

- Preserve the larger hero and uncluttered portal.
- In follow mode, when not showing an already disclosed guardian, blend the publicly computed coastline stage offset (0.58) with an already disclosed reachable nearby objective displacement (0.24) and cap the vector magnitude at 2.5 world units. The ordinary follow and mobile framing remain less shifted; overview, danger and detail are untouched. No private geometry or new safe-route statement.
- The new pure regression checks stage direction, nearby-goal combination, max offset, portrait and invalid input; standalone numeric invariants passed. [CI 41163986082](https://github.com/my-edutu/Ai_games/actions/runs/41163986082) was **in progress at the original candidate note**; it later passed, with the real render inspected and documented below.

## Candidate-stage evidence protocol (subsequently completed for the lead comparison)

The twelfth-pass native-size image, timestamp, manifest SHA and visual observations are verified in the section below. A **fresh independent** A/B and key/closed-gate screenshots remain outstanding. Do not fabricate a screenshot, materialize secret exits, assert parity from unit tests or call SwiftShader CPU-throttled frame times hardware FPS.

Shared-workspace subagent/Ultracode access failed again with the explicit disconnected tunnel error. No fresh independent visual comparison has occurred; the last independent verdict remains **Nintendo wins**. Draft PR stays unmerged and undeployed.


## Authentic twelfth-pass evidence and comparison (2026-10-31)

[Autonomous Games CI 41163986082](https://github.com/my-edutu/Ai_games/actions/runs/41163986082) **succeeded** on source `5395d5f`: 522/522 Node unit tests, 25/25 browser checks, build, four stream-host self-tests and determinism scan. All three Eko companion workflows passed. These are functional checks, not a visual-parity score.

Downloaded and decoded the actual browser [artifact 13028114405](https://github.com/my-edutu/Ai_games/actions/runs/41163986082/artifacts/13028114405), including `observed-landmark.png` and `observed-landmark.json`. Screenshot size **1280×900**, captured **2026-10-31T03:25:44.217Z**, real seed `maze-visual-reference-13`, tick **26**, public exit `69` one known legal step from Pip, `objectiveInFrame=true`. The PNG and manifest both report SHA-256 `e7c84ac1c4cf48ee6efc434b8a7411a37b25e026ef323ebc72ef0a2c5a3f44f7`. Its source SHA-256 pins are: `map-view.mjs=297f5bacb099205bcd2fc291cfc1e46cd3098a0d2fabe8b204742aefd8ca5895`, `scene.js=499d39ab7a215c3ab9f48524d3fb98955ebe9c2a7e70109ae5d5acf962ad4e1e`.

**Actual lead visual inspection** compared this image against the genuine pass-eleven capture with the identical seed and tick. With the new camera offset, substantially more beige stone path and terrace detail fill the right-hand view. Pip and the exit arch remain visible and broadly the same scale. The empty turquoise region on the left is smaller. An identical simple water-color mask over the 946×715 game viewport yields **44.57%** water-colored pixels before and **35.66%** after (an 8.91 percentage-point difference). The mask cannot identify aesthetic quality, and camera projection naturally changes pixels; this is only a tightly defined composition observation.

**Gaps still visible:** some right-side architecture remains cropped, Pip's face/gaze occupies few pixels at game size, and the next exit passage still does not have Nintendo-level immediate, distinctive action hierarchy. Actual key, closed-gate and guardian gameplay states need separate truthful capture. The last independent critics still prefer the unmodified exact Nintendo imagery. A fresh, separate, version-blind A/B was not available because the shared-workspace tunnel was disconnected. **No benchmark win.** CI's software-WebGL sampled `frameP50Ms=216.6` must not be represented as hardware frame rate.
