# Twelfth-pass camera composition — source candidate, rendered verdict pending

Source [5395d5f](https://github.com/my-edutu/Ai_games/commit/5395d5f66a0104dc60d693e7e93a696e53c68ded) on `feat/maze-3d-gauntlet`. Fixed bar: original exact Nintendo Captain Toad references in [reference-manifest.json](./reference-manifest.json); never swap them. **Benchmark NOT PASSED.**

## Critic's last genuine observation

The actual pass-eleven `observed-landmark.png` in [CI artifact 13026233263](https://github.com/my-edutu/Ai_games/actions/runs/41157967040/artifacts/13026233263) was captured at **2026-10-31T02:07:46.806Z**, 1280×900, seed `maze-visual-reference-13`, tick 26, disclosed exit cell 69, SHA-256 `4f00eca791ef87e343008e4f781e809c58342220a511254d371521d6fb549998`. Pip and the arch became larger, but the left screen contained too much sea while right-side architecture was cropped. The lead's simple native-size color-classification baseline estimates about **44.6% water-colored pixels** within the 946×715 game viewport, versus about **38.9%** in pass ten, using the *same rough color mask*; this is not a perceptual score or independent critic.

## Small implementation and truth constraints

- Preserve the larger hero and uncluttered portal.
- In follow mode, when not showing an already disclosed guardian, blend the publicly computed coastline stage offset (0.58) with an already disclosed reachable nearby objective displacement (0.24) and cap the vector magnitude at 2.5 world units. The ordinary follow and mobile framing remain less shifted; overview, danger and detail are untouched. No private geometry or new safe-route statement.
- The new pure regression checks stage direction, nearby-goal combination, max offset, portrait and invalid input; standalone numeric invariants passed. [CI 41163986082](https://github.com/my-edutu/Ai_games/actions/runs/41163986082) **in progress** at review creation; browser image and functional verification not yet claimed.

## Required fresh evidence

Inspect the *real new* `observed-landmark.png` only after its source-bound CI artifact is available. Verify seed/tick/source hashes, visually compare hero, portal, objective first step, shoreline and architecture at native size; mask version labels for fresh critics if possible. Do not fabricate a screenshot, materialize secret exits, assert image parity from unit tests or call shared SwiftShader CPU-throttled frame times hardware FPS.

Shared-workspace subagent/Ultracode access failed again with the explicit disconnected tunnel error. No fresh independent visual comparison has occurred; the last independent verdict remains **Nintendo wins**. Draft PR stays unmerged and undeployed.
