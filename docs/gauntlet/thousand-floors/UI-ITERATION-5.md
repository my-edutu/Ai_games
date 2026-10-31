# Iteration 5 — compact expedition interface

31 October 2026. Continuation of the user's request to improve Game 4's UI. Baseline runtime: `e4c30451261cf75a4eea54dd5ed842f168f99c43`. Publication stays on draft PR #55.

## Implemented

The full-screen pale wash is removed. Smaller dark-green information panels, warm-gold progress and primary playback action, consistent outline icons and a separate expedition status make the on-screen hierarchy more deliberate. The renderer canvas is unchanged and the center remains available for the explorer and next landing. Portrait and short-landscape layouts have separate compact arrangements.

Journey is a native dialog with current floor, current district, cleared-floor percentage, recovery checkpoint and ten explicitly labeled district states. It reads only the existing application's rendered outputs. It does not create a second campaign state, fake a saved status, introduce made-up audience metrics, or touch worker/simulation/save authority. Arriving at floor 1000 is not counted as finishing it. Invalid progress is displayed as unavailable.

Settings use keyboard-operable switches with 44px hit areas. Recovery confirmation, clean-feed escape hatch, source review warning, reduced-motion preference and forced-color fallback remain available. Modal key presses do not trigger gameplay shortcuts. Startup/error overlays dismiss Journey and put focus on the actual recovery action.

The existing static-server allowlist explicitly includes interface.js. No directory-wide or arbitrary script serving was enabled.

## Verification executed in this retry

- `python tests/ui/test_thousand_floors_interface.py`: **10 passing browser tests**, using locally installed Chromium through Python Playwright. These exercise the real HTML/CSS/interface module with fixture values in app-owned nodes; **app.js, the worker, Three.js and audio are not executed in this harness**.
- Layout assertions cover 320×568, 390×844, 568×320, 844×390 and 1440×900, long district/intent text and storage warnings. Controls stay at least 44px; the progress block remains above 46% of viewport height and the control rail below 64%. This verifies layout rectangles, not clearance against an animated explorer.
- `node --test tests/foundation/thousand-floors-server.test.cjs tests/foundation/thousand-floors-ui-assets.test.cjs`: **6 passing tests**, including original routing/traversal checks and actual HTTP responses for the new assets, MIME types, CSP and nosniff.
- `node --check public/ai-vs-1000-floors/interface.js` and `node --check scripts/serve-thousand-floors.cjs`: passed.
- Original index.html and server reconstructions were verified against GitHub blob SHAs before editing. Every original runtime DOM ID is retained exactly once.

RED→GREEN evidence: missing Journey entry failed before implementation; new module initially returned null/HTTP 404 in the original server and passed after explicit allowlisting; a 568×320 progress card initially exceeded its safe-zone threshold (153.2px versus 147.2px) and passed after reducing short-landscape spacing; switch-role test failed before the settings toggle refinement.

Desktop, portrait, short-landscape, Journey and settings were inspected as browser-rendered UI-only captures. Capture backgrounds are deliberately marked as not rendering the 3D game. No composited or generated image is presented as gameplay.

## Rulings and limits

Ruling: implement only the presentation layer in this retry, preserving scene/camera/character/simulation behavior. The connected coding workspace was offline, remote sandbox creation was unavailable, and the local environment could not fetch dependencies. Cost: the requested overall visual bar remains open, and current HUD/scene integration still needs an actual-game rerun.

Ruling: read the existing public HUD output instead of adding worker subscriptions or exposing internal state. Cost: the module depends on the current display contract (including checkpoint and district labels); the contract is covered by tests. Closed Journey panels skip rendering updates.

Final review: **self-review (no working subagent tool)**. Not a fresh independent critic. Findings fixed: short-landscape safe zone, native toggle presentation, and the new module's server route. Deferred: broad user comprehension, low-bitrate readability, actual 3D-camera occlusion and hardware performance.

The complete repository suite, TypeScript campaign build and full-game Chromium tests were **not rerun** in this retry. Earlier six full-game passes and 22 campaign/camera/server cases belong to iteration 4, not this change. The previously reported unresolved catalogue phase-6 failure is not claimed fixed. No new character/scene work, ASTRO BOT A/B result, independent review, production deployment or unattended loop is claimed.

**Gauntlet verdict: benchmark not passed.** Next comparison must use the actual moving game with this interface; district composition, character expressiveness and surface finish still need substantial work.

## Repeat the interface checks

The Node asset test needs no added package. The optional UI harness uses Python 3.10+ and the test-only `playwright` package with Chromium. Set `CHROMIUM_PATH` to an installed browser, or install Playwright's Chromium. These are test dependencies, not browser runtime dependencies.

```sh
node --test tests/foundation/thousand-floors-server.test.cjs tests/foundation/thousand-floors-ui-assets.test.cjs
python tests/ui/test_thousand_floors_interface.py
```
