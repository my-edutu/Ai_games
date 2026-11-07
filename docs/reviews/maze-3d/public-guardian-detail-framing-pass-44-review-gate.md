# Game 2 — Pass44 source-disclosed guardian and explorer Detail camera staging (2026-11-01)

**Status: Pass45 original renderer images verified, lead local framing improvement; fixed Nintendo benchmark NOT PASSED. Separate fresh-context blind critic still PENDING.**

## Actual-image issue, not an abstract metric

The Pass43 genuine 1280×900 [full-frame browser image](https://github.com/my-edutu/Ai_games/actions/runs/41311802088/artifacts/13085956393), captured 2026-11-01T13:42:05.132Z, SHA `27ccade231bb1071362dfde290f9687393336860587639dc06194ae8fdeb916a`, shows Pip left-middle and real source-disclosed Thornback near the upper-right edge with no obvious two-character action relationship. The two hinged armor passes had tiny visible effects in the full source screenshot, despite working model tests. Their visual gains were **rejected**. In source `scene.js` the encounter test explicitly uses `?camera=detail`, yet guardian attention-based centering was previously applied **only** when `cameraMode === 'follow'`. This makes the main photographed encounter an unrealistically hero-only camera even as the real publicly disclosed warden approaches.

## Small builder/critic slice

- [Pure public helper `24723ce`](https://github.com/my-edutu/Ai_games/commit/24723cec0298090e505a6fd17164a6878f76e590) selects bounded cosmetic scene-target weight from only existing `closestThreat.strength`, the chosen camera mode, terminal status and viewport aspect. Follow remains **exactly** the previous `alert * .22`; Overview/unknown/terminal/invalid alert stay at zero; Detail uses at most **halfway** toward the publicly visible opponent on desktop and at most **0.22** on a real narrow phone to avoid pushing the explorer offscreen. No other creature is sought or inferred.
- [3D camera integration `446426d`](https://github.com/my-edutu/Ai_games/commit/446426dab007015bc65d22e276c45b409275b973) uses this pure weight with the actual known rendered actor position. No movement, camera angle, zoom, AI, key, collision, map authority, scene prop or hidden knowledge changes.
- [Focused pure regression `5a5b4ad`](https://github.com/my-edutu/Ai_games/commit/5a5b4ad7b5394b2b5376cb20bd23d1b3913670ce) checks desktop Detail midpoint and native hero restraint, unchanged Follow, terminal/unknown/zero/NaN/Infinity cases and clamp. Source-bound real Chromium CI is necessary before accepting rendering.

## Authentic review gate

Run the same actual production seed `maze-visual-reference-13` tick13, one truly disclosed 2.236-cell guardian, and compare SHA-verified **1280×900** original Pass43 vs Pass44 at full native size (not just crop). New `encounter-public-portrait.png`/JSON capture uses the same source tick in the existing Chromium browser for **390×844**; compare the real result rather than assuming desktop framing applies. Verify both actors remain in frame; physical floor routes, hero pose and visible warning are legible; no cropped model, empty-water penalty or hidden cells are exposed. Record true screenshot UTC, pixel SHA and source commit, and reject if the change merely shifts clutter or hides Pip. Use the unchanged two official Nintendo Captain Toad SHA-frozen reference images and supporting Luigi's Mansion 3 expressive-character visuals.

Neither passing unit/browser tests nor changed pixels establishes a perceptual win. The shared-workspace tunnel for separate fresh-context builder/critic and Ultracode was unavailable; no blind preference is invented. CPU-throttled SwiftShader is not representative hardware GPU FPS. **Do not merge or deploy; PR #53 remains draft.**


## Pass45 original full-size review — 2026-11-01

See [Pass45 authentic image/hash review](./guardian-detail-pass-45-original-render.md) for current-source CI 41315186013, original artifact 13086937045, seven authentic PNGs, native guardian screenshot and an unblinded comparison against actual Pass43. Pass45 phone camera now keeps Pip and the disclosed Thornback in frame with margin, but their grounding/focal action and scene art still fall below the byte-frozen Nintendo bar. Pass46 is a new independently judgeable source-only contact-shadow candidate pending its own renderer gate. Neither pass is an independent Nintendo quality win.
