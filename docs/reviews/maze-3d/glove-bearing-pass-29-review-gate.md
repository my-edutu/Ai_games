# Game 2 pass 29 — modeled glove bearing toward the actual disclosed lock (2026-10-31)

**Status: pass29 authentic native render inspected and visually rejected; pass30 source OPEN.** This is a prospective review gate, **not** a claim that pass 29 screenshots were captured, that full CI passed, or that Captain Toad is beaten. The last actual inspected screenshots are pass 28 (see below).

## Why this independently judgeable slice

The original 390×844 pass-28 production frame has a small mint key beside Pip's helmet, but there is still no immediately clear gesture from his actual glove toward the physically closed gate's lock. Enlarging the key and repositioning the socket in passes 23–28 did not solve this causality. The smallest next piece is articulation: turn the left shoulder in the direction of the **existing public** matched-gate bearing without inventing a passable gate, opening animation, guide beam, hidden key or HUD prose.

- Test-first source contract [ccf0689](https://github.com/my-edutu/Ai_games/commit/ccf06899810c0605bb4d4c2f2b727ca21222a943): both full/balanced models must turn the same physical left shoulder toward right/left known lock bearings; weaker real proximity produces smaller rotation; unmatched/unknown, terminal and guardian states clear or suppress it. Reduced-motion retains a stable static gesture, with no time-based oscillation required.
- Builder candidate [5c37549](https://github.com/my-edutu/Ai_games/commit/5c37549f8752eaf5bd9620b271d69b043162ebd1): only the modeled left shoulder's Y and Z rotations change. Y follows bounded \`keyYaw * 1.5\`; Z sweeps toward the same known gate bearing with \`keyYaw * .55\`. The already-modeled held key, lock, pose selector and authoritative state remain untouched. Existing head, arm elevation, blinking, camera, world, controls, route rules and resource lifecycle remain untouched. One constant-time pair of rotations per frame; no new geometry, memory or draw calls.
- **Policy/fairness:** \`keyYaw\` exists only after the presentation adapter passes an exact matching carried-key/observed-closed-gate cue from \`publicCarriedGateCue\`. A disclosed nearby guardian outranks it; terminal states suppress it; an absent heading creates zero pose, not NaN. The actual gate stays closed until authority says \`door.open\`. This source change does not mutate public snapshots or private simulation state.

## Fixed image bar and authentic baseline

The frozen Nintendo reference is [Captain Toad: Treasure Tracker](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) with two official 1280×720 source images and fixed SHA-256 values in [reference-manifest.json](./reference-manifest.json). Do **not** substitute new screenshots, re-encode benchmark images or claim stylistic parity based on unit tests. Luigi's Mansion 3 and ASTRO BOT remain supporting references.

**Last inspected actual production browser evidence is pass 28**, [CI artifact 13055687573](https://github.com/my-edutu/Ai_games/actions/runs/41234490759/artifacts/13055687573), real seed \`maze-visual-reference-13\`, tick **21**, genuine publicly known **closed door-2** with exact carried matching key. Desktop 1280×900 captured **2026-10-31T19:37:28.999Z**, SHA-256 \`082665cb594fd50a638667be6525ad67d1b49bd31cd8efa4c5d45038c6e89b90\`. Portrait 390×844 captured **2026-10-31T19:37:32.346Z**, SHA-256 \`142ad23b78bf89792764c2511a1b0e9c1be278599aecbd320ad3803107cda1da\`. Those bytes and source-linked manifests were previously inspected and verified; they **do not** show the new arm-turn candidate. Pass-28 run was CANCELLED after capture generation, not a green full CI.

At native portrait scale pass28 still suffers small actor/key/socket hierarchy, partial upper-right arch crop and large open lagoon. The Nintendo benchmark wins.

## Builder → independent fresh-context critic gate (must execute when available)

1. Run the existing \`tests/phase3/maze-3d-characters.test.cjs\` contract, the public cue and gate-world tests, build, deterministic scan and browser suite. Record exact command results; do not weaken cadence, composition or source assertions to obtain green.
2. Obtain **exact-pass29-source** real 1280×900 and native 390×844 production seed/tick 21 **still-closed** gate captures through the existing evidence workflow. Record original UTC capture times, current source commit and SHA-256 for the actual PNG bytes; independently match each adjacent manifest. Never use composited/mock screenshots as raw output.
3. Blind-label pass28 vs pass29 screenshots with random A/B identity. A **separate fresh-context visual critic** must open full native-resolution images and judge actual glove/shaft/key-bow/socket direction, key occlusion, actor/gate scale, arch clearance and lagoon/foreground balance. Then compare the winner against **both fixed Nintendo reference images**. A second separate critic should check public-state privacy, deterministic transitions and scene/resource stability.
4. Fail acceptance if the key looks detached/floating, the shoulder crosses Pip's helmet, the gate falsely appears opened, the upper arch worsens, mobile cropping or HUD clutter increases, character/lock are out of frame, or reference still wins. Feed the largest objective mismatch into the next smallest builder slice.
5. No representative GPU-FPS claim from CPU-throttled shared SwiftShader. Report separate hardware profiling only when actually measured. No independent win without separate reviewer evidence.

## Current limitations and release decision

The \`mcp__chat_on_steriod__exec_command\` and \`agents\` operations both returned \`Tunnel-client has not been seen for 300 seconds\`; no remote source-workspace rendering, subagent pair or Ultracode was available at implementation time. GitHub source commits succeeded, but local red/green and native pass29 rendering could not be run here; [CI 41245527570](https://github.com/my-edutu/Ai_games/actions/runs/41245527570) started on the current gameplay head and is **not** presumed green. The lead's code analysis is not an independent blinded visual review.

**Fixed bar: NOT PASSED. PR #53: DRAFT, unmerged, undeployed. Continue Gauntlet.**

## Pass 29 genuine render verdict — October 31, 2026

The corrected pass-29 head `542ebb8` generated [original production browser artifact 13059797608](https://github.com/my-edutu/Ai_games/actions/runs/41245936937/artifacts/13059797608). I downloaded the original ZIP and independently checked the untouched PNG SHA-256 against each adjacent JSON manifest. Both show real public seed `maze-visual-reference-13`, tick 21, the genuinely **closed**, disclosed `door-2` and a legitimately carried matching key.

| Native capture | UTC date/time | SHA-256 |
| --- | --- | --- |
| 1280×900 desktop | 2026-10-31T22:04:18.531Z | `f0e6361da42e73f11d57150af5305a0a488931abd5e5c2a511c167bd37a00694` |
| 390×844 portrait | 2026-10-31T22:04:21.583Z | `00eb1308fd182c07d86f87c13fc6a0ccd6b582520e36b2f7930d8dea622ebc87` |

**Lead screenshot critique, not an independent blind verdict:** same-seed/tick original pass28 vs pass29 imagery changes **0.181% desktop / 0.329% portrait** of pixels by more than 12 in any RGB channel (change extent, **not** an artistic score). The directional shoulder turn pushes the mint key bow **partly behind the foreground sandstone** at actual 390px portrait scale. The physical hand→key→keyhole gesture is still ambiguous; upper-right arch crop and excess lagoon also persist. Pass29 is **NOT VISUALLY ACCEPTED**. The fixed official Nintendo *Captain Toad* benchmark still wins.

[Exact-head CI 41245936937](https://github.com/my-edutu/Ai_games/actions/runs/41245936937) **FAILED** overall despite successful build/Node, Maze and other stream hosts, determinism scan and original browser capture. Browser results: **104 passed / 3 failed** — Tiny Kingdom G057 plaster, G058 grass and G063 river-source assertions. No Maze browser failures were recorded. These are separate cross-game checks; do not relax them or claim the suite passed. Software SwiftShader desktop `frameP50Ms≈416.7` is CPU-throttled and **not** hardware GPU FPS.

## Pass 30 connected-wrist counter-turn — source committed, visual gate OPEN

- [Source 1a6fe8a](https://github.com/my-edutu/Ai_games/commit/1a6fe8a7bc09e46d63d9044de8a3eef3d689c072) counter-rotates **the actual modeled left elbow**, `elbow.rotation.y = -keyYaw * .9`, as the shoulder aims toward a legitimately known closed gate. Its key prop remains attached to the glove. Existing public-state cue suppression for neutral, guardian and terminal frames remains; no hidden route, simulation rule, gate opening, detached overlay, new geometry or draw call.
- [Focused test f1da826](https://github.com/my-edutu/Ai_games/commit/f1da82677df3aa6448f6f5e2121eada145142368) checks connected wrist direction for both public bearings and its reset on missing key, nearby guardian and terminal state, without deleting the original bearing/key-height contracts.
- **Pass30 source has not yet passed its authentic visual gate.** Run exact-source build/Node/host/determinism/browser tests; compare dated, hash-verified 1280×900/390×844 images blindly against pass28/29 and both unchanged Nintendo frames using a separate critic. Fail if the bow remains behind masonry, the glove looks disconnected, the arch crop worsens or the reference still wins. No independent victory is claimed. The workspace tunnel returned `Tunnel-client has not been seen for 300 seconds`; fresh-context subagents and Ultracode could not be used. Keep draft PR #53 unmerged/undeployed and the Gauntlet active.
