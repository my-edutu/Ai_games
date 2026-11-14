# Round 12: grounded character, distant landscape and stable props

Base feature head: `3f23e6d0b11b3bb8f29eaa1e005bf6c5eda65e27`. This is a continuation of the approved Snake 3D spec, not a simulation or gameplay change.

## Changes and evidence

**Ground contact.** The previous constant body centre left the main belly 0.11928 world units above the floor; its taper floated higher as its radius shrank. Ring centres now follow their local belly radius with 0.03 clearance. The buried head/neck transition is retained, the skull is aligned with the new neck height, and chewing has lift compensation. Isolated portal tails remain separately capped and grounded. Tests inspect actual model vertices at both detail levels, 48 animated poses, bounded resources, unchanged public paths and portal discontinuities.

**Landscape.** Seven raised headlands and groves fill previously empty directions behind close-up views. The first candidate's disconnected-looking caps were rejected; the retained version uses one continuous shared layered-cliff primitive. Existing stone/moss maps and material batches are reused. The 28x16 world retains 13 static material meshes, 22 materials, 4 textures and 39 draw objects; owned geometry rises from 36 to 37. Exact hashes verify unchanged court and coping vertices on three board sizes. Added distant vertices are not a performance win; initial bake and direct-camera costs still need measurement.

**Stable props.** Countdown-only hazard phase changes previously dirtied every gameplay instance buffer although phase is not used in their geometry. Trap buffers now depend only on cell/active state. Portals and obstacles have an independent visible-topology signature and are included in the overview cache. A monotonic local prop revision invalidates the cache on addition, movement, recoloring by portal order or removal. They retain disabled cast shadows; no stale cached shadow is introduced. Traps, fruit, water and the character remain live.

## Pre-publication verification

- Red tests reproduced missing raised landscape sectors, a floating belly/taper and redundant prop uploads; the implementation now passes those regressions.
- All **36 focused Snake Node tests passed**.
- Fresh full `npm test`: **539 passed, 0 failed, 0 skipped, 0 cancelled**, including the TypeScript build. An earlier HUD-only local run had one Eko timing failure; that is historical, not the result of this full run.
- Edited production modules pass `node --check`. Published production blobs are compared with the tested files' Git blob hashes.
- Real Chromium/SwiftShader captures were inspected at 1440x1200 character view, 1920x1080 overview and 390x844 portrait. No page errors. These local captures use a retained public fixture and a fixed native render ratio for visual inspection, not live-host performance acceptance.
- A real browser prop lifecycle probe held cache builds stable for countdown and trap activation, then rebuilt exactly once for addition and once for removal. Added props changed 1152 screenshot pixels; removal restored the starting image pixel-for-pixel (zero differing pixels). Resource texture count stayed stable; no page errors.
- A matched frozen-frame diagnostic reduced ordinary draw calls from 46 to 42 and triangles from 9247 to 7455. Short sequential submitted-FPS samples were 10.79–11.92 before and 12.22–12.75 after. These are not randomized sustained hardware measurements, display-present FPS, or a production gate pass.
- A new live-host browser regression covers phase/activation separation, prop addition/removal, exact cache rebuilding and clean WebGL. Existing acceptance thresholds and tests are unchanged. Exact-head CI must be read after publication.

## Round 11 CI result

On `3f23e6`, focused browser run `41165222360` passed **14/15** tests, including both new HUD stability cases. Desktop pacing remained failed: **10 actual submissions over 1012.8 ms**, versus the unchanged requirement of at least 17 in that sample. General run `41165222590` passed build/Node, all four host self-tests, nondeterminism scan and operations evidence, then failed browser verification. It was not an overall CI pass.

## Review and open gates

Self-review only. The shared worker connection was retried and remained offline (`tunnel_client_not_seen`), so no independent review or fresh whole-game WIN verdict is claimed. The approved commercial visual bar, full-game frame delivery, hardware/device motion review and production readiness remain open. Retained `/progress` images predate this round and must not be represented as current captures.

Keep PR 52 **draft, unmerged and undeployed**. Reverting this checkpoint restores the previous character height, landscape and prop rendering. Neither missing independent evidence nor a passing Node suite is a Gauntlet victory.
