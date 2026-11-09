# Session 9 — spectator continuity, verified local UI increment

Draft PR #70. UI baseline: `24865fc29b8f800989252b617e1e00bba1406a9f`.
Do not merge or declare the game transformed on this evidence.

## What changed

Only production `spectator-ui.js` and `styles.css` change in this increment.
Camera, geometry, authority, animation, sound synthesis, app integration, server,
watchdog and global Gauntlet ledger are left untouched.

- Existing hero cards remain the selection authority. One bounded observer mirrors
  their real selected/disabled attributes immediately after keyboard or mouse
  selection, without waiting for a new simulation snapshot or steering a camera.
- Mobile quick cards show named healing Focus with its actual maximum, a selected
  check mark, Following/Low health/Fallen text, and exact HP. Nodes are retained.
- Clean view, map and journal preserve the default canvas rectangle. Previously,
  clean mode changed a 390x844 canvas height from 624.55px to 740px. It now stays
  624.55px. Clean mode intentionally does not expand the world behind hidden HUD.
- Keyboard focus survives quickbar-to-desktop transitions, hiding the interface,
  removal of a hero, genuine defeat and autonomous restart. Journal Escape returns
  to the interrupted usable control, with a visible fallback when it disappears.
- The nine-entry journal becomes a reading surface: an open record stays put as
  genuine events arrive. A bounded Update control refreshes explicitly, without
  replacing the reader's nodes or moving focus. It labels the shown run/floor/turn.
- Installation is idempotent and has explicit listener/observer cleanup. Unchanged
  text and control attributes are not rewritten. No new timers or fetch loops.

## Evidence provenance — important boundary

The remote execution tunnel was offline. Local Chromium navigation to localhost
was blocked by administrator policy; policies were not altered. A test-only
in-memory transport loaded genuine repository ESM, original GLB/texture assets,
and genuine `DungeonRuntime` snapshots into Chromium with software WebGL.
There is no mock renderer, generated artwork or fabricated gameplay state.

The available source workspace came from successful workflow run `42427983532`,
artifact `13595963633`, source `c51342c0253435325d6a46e4d9f02b337a2ad138`
(Dungeon v0.5.0). PR70's current HTML/CSS/spectator source was restored and
verified by Git blob SHA; its existing UI-only app/watchdog integration was
applied locally. The new candidate then changed only the two UI files above.

**The runtime is archived, not the latest full PR70 engine (v0.6.0).** Local test
and capture results do not certify exact-head integration, production HTTP/CSP,
real-device performance or synchronized original audio. None of the archived
app/runtime/environment files are published back as production replacements.

## Executed checks

- Browser red stage: five failures reproduced missing focus mirroring, clean-view
  resizing, breakpoint focus loss, journal churn and missing mobile Focus.
- Two further red checks exposed native dialog close-focus timing and missing
  idempotence/disposal. The responsive test was strengthened to await the native
  media-query event; it still failed against the original UI.
- Final browser batch: **10/10 pass**, retries zero, actual Chromium/WebGL.
- Additional natural Warden warning/release test: **1/1 pass**. It searches the
  real seeded expedition for an actual warning followed by a cast; no HP/position
  editing. It checks STRIKE RELEASED rather than an unverified successful hit.
- Full local workspace `npm test`: initially **1040/1041**. The one failure was an
  obsolete UI-source assertion expecting the old tactical boss label. Only that
  UI assertion was corrected; camera/light/body-clearance assertions remain.
- Final full local workspace `npm test`: **1041/1041 pass**, zero skipped.
- Focused Warden contract file: **7/7 pass**. Its browser companion's first cast
  label assertion now expects STRIKE RELEASED; the later EXPOSED assertion remains.
- Actual UI checks cover unchanged snapshot checksums after focus, retained nodes,
  clean/map/journal canvas stability, 44px controls, no 390px horizontal overflow,
  reduced-motion CSS, native audio initially off, stale reconnect in clean view,
  genuine defeat and a genuine automatic next run.

Commands (normal HTTP integration remains available via the standard config):

```sh
npm test
npx playwright test -c tests/browser/dungeon.playwright.config.cjs dungeon-spectator-continuity.spec.cjs
DUNGEON_OFFLINE_EVIDENCE=1 DUNGEON_BROWSER_EXECUTABLE=/usr/bin/chromium \
  npx playwright test -c tests/browser/dungeon-spectator-offline.playwright.config.cjs
```

## Actual captures

Matched before/after screenshots at **1440x900** and **390x844** use the same
unmodified seed, run 1, floor 1, tick 18, checksum **399af103**. Each sampled frame
reported **9 textured characters, zero missing assets**, matching rendered-state
checksum and no browser page errors. No geometry/camera/art changes were made.

A silent, unretimed **93.08-second actual browser recording** shows live state
advancing from tick 33 / floor 1 to tick 268 / floor 3, real focus selection,
journal refresh and clean toggles. It delivered 152 public snapshots in that
capture. Separate real screenshots show natural Warden warning/release and
natural defeat. Evidence is provided with the conversation handoff ZIP, including
source files, patch, red/green logs and capture receipts.

**Motion quality is not passed.** Software rendering was slow: observed rendered
frame counter advanced from 6 to 38 over that live capture. A 25fps video container
is not proof of a 25fps game. No smoothness, GPU benchmark or audio-sync claim.

## Review and remaining gates

Self-review only: no independent worker was reachable. Production diff preserves
all pre-existing danger/progress planners and the camera helper byte-for-byte.
Three quick buttons, nine journal records, one observer and recorded event
listeners have bounded ownership; dispose removes them. Text remains sanitized
with textContent. No authoritative state or gameplay timing is changed.

Next integration gate: run the normal HTTP browser suite and full tests against
the latest complete PR70 tree, inspect a real hardware/browser recording, check
screen-reader behavior and mobile devices, and obtain independent review. The
broader artistic, animation and performance targets remain open.

Rollback: revert this single UI continuity increment. No save migration or game
version changes are needed. Nothing is merged to main or deployed.
