# AI Dungeon — Gauntlet Round 016: Material readiness and repeated actions

Date: 2026-10-31. Parent: `3200f6ed8b10fcb58fbf6ee17e21f6044ff0fabb`. Continue draft PR #49; do not merge.

## Real-output findings

The retained browser trace and genuine screenshots from Actions run **37869902202** were inspected. The authority job passed; the browser job failed. GLTFLoader repeatedly logged failed embedded blob-image fetches under `connect-src 'self'`. Authored characters in the inspected desktop capture were white. A successfully parsed GLB was being treated as ready despite failed nested textures. The retained camera test expected `chase` while its last render diagnostic remained `tactical`.

Source review additionally found that successive same-type one-shot attacks ignored `actionTick`, allowing completed animation actions to remain clamped. This was reproduced against the original production module in focused tests; it is not represented as an independently observed gameplay verdict.

## Builder changes

- Permit local blob resources in **connect-src** and **img-src** only; script/default/object restrictions remain unchanged.
- Track each asset request's nested failures and declared base-colour textures. An incomplete asset keeps the existing procedural rig visible instead of replacing it with white art.
- Expose decoded colour-map and textured-character counts through the existing render diagnostics.
- Restart one-shot animations on a new authoritative action tick; preserve continuous movement and avoid crossfading an action into itself.
- Add focused Node regressions, real-browser material assertions, an embedded-image decoding reproduction, and camera tests that wait for each rendered mode. Serialize software-WebGL browser workers; retain the existing acceptance tests.
- Record this iteration separately in the live `/dungeon/gauntlet` history. No gameplay or authority changes.

## Verification performed in this session

`node --test tests/foundation/dungeon-presentation.test.cjs`: original source **5 pass / 5 fail**; revised source **10 pass / 0 fail**. These execute the production module with engine/loader boundary doubles, not a full Three.js renderer.

Isolated Chromium checked the genuine swordsman GLB extracted from the CI trace under the exact server policy. Original policy: bitmap fetch and image decode both failed. Revised policy: both decode **1024 x 1024** pixels. The new browser spec contains a portable version of this reproduction using the server's policy and actual asset bytes.

Syntax checks passed for the server, model loader, new browser spec and browser config. The full npm suite and full Three.js browser run have **not** been run locally: this workspace contains only the inspected files and the external workspace is offline. New GitHub CI results remain pending at commit time.

## Critic verdict and remaining gap

**Diablo IV primary bar NOT MET.** Path of Exile 2 and No Rest for the Wicked remain supporting references. There is no new integrated full-game capture, no matched independent A/B verdict and no production-readiness claim. The source still needs a separate boss-camera coordinate correction, more developed original character/environment art, and measured scene/readability/performance review.

Review in this round is **author self-review**, not a fresh-context independent critic: the external subagent workspace did not connect. No ultracode execution is claimed. Keep the draft and visual gate open; evaluate real new CI captures before judging appearance.

## Rulings and risks

Repair the failed existing material path rather than mask white meshes with tint or replace assets. Keep the existing optional-asset fallback and bounded per-asset cache. Add browser-native reproduction rather than claim a portable full runtime was executed. The cost of these scoped decisions is that detailed art, integrated rendering and independent comparison remain unproved. Roll back by reverting this round's commit; no authoritative save-format or simulation migration is needed.
