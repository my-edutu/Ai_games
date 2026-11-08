# AI Dungeon — Session 9 Spectator UI Handoff

**Working PR:** #70 (draft), `feat/ai-dungeon-spectator-hud-20261108` targeting Draft PR #49's development branch. **No merge, no deployment, no changes to main.**

## Scope and design rule

Own only HTML, CSS, read-only spectator state projection, UI text/control interactions, UI startup/recovery handling, and task-local tests. Do not change authoritative simulation, camera policy, character models, animation, environment, sound synthesis or global Gauntlet ledger. The visual-quality bar is **not met or certified** by this UI work.

**Ten-second comprehension:** (1) the party is descending a floor, (2) which heroes survive and their exact resources, (3) live hostiles/traps and whether the portal is available, (4) what verified threat has been signaled, (5) the last meaningful outcome, (6) which hero the camera follows.

## Implemented presentation contract

| UI component | Snapshot source / invariant | Display rule |
| --- | --- | --- |
| Party quick-focus (phone) | `units[]` with `faction==='party'`; delegates click to real keyed party card | Three small keyed buttons over the 3D canvas; current HP and maximum, visible focus, dead hero unavailable; no gameplay commands |
| Party detail cards | Existing production app's live party rendering | Healing focus written as named resource and available maximum; accessible follow name updated without assuming a cinematic-only view |
| Floor progress | `units[]` live enemy HP, `traps[].active && !disarmed`, authoritative intermission | Exact hostiles/traps, available/sealed portal, current objective; no fractional completion or fabricated win state |
| Warden warning | `bossWarning.cells/attackTick` with living Warden and near-party constraint | Warning shape and simulation turns to release, never seconds or a promise of damage |
| Warden strike | Warden `action==='cast'` and `actionTick===tick` | **STRIKE RELEASED**, not **STRIKE LANDED**, unless separately proven by authority |
| Warden counter | `bossRecovery.remaining` while shield down and Warden near | Recovering / exposed; never implies that the spectator can act |
| Warden shield | `guardianWard` and living `defendersRemaining` | Shield status and guard count, no invented opening |
| Other imminent danger | Real `cultistWarnings` / `revenantWarnings` and future impact tick | Marked tiles and bounded simulation-turn countdown |
| Recent outcome (phone) | Latest approved `events[]` within 6 authoritative ticks | At most a two-line historical event, textContent only, no fake flashing live danger |
| Journal | Latest 9 `events[]` items | Native dialog, Esc close, focus returns to opener, bounded text, not a scrolling dashboard |
| Audio | Existing original soundstage toggle | Remains user initiated; explicit muted preference stored locally; no autoplay on refresh |
| Connection | Successful fresh `/dungeon/state` tick/run + existing renderer guard | Do not call restored HTTP on an unchanged tick a healthy expedition; keep stale warning until genuine new state |
| Loading | First public tick **and** actual rendered WebGL frame | Startup overlay remains until both signals; verified failure shows recovery instead; background tab cannot exhaust startup timer |
| Defeat/restart | `phase==='intermission'` and `intermission` | Recorded floor/kills/gold and honest countdown in simulation turns; restarts automatically through authority |

## Layout and accessibility

- Desktop (1440×900): camera/view canvas remains the primary surface; contextual health/expedition information occupies the edges; central combat corridor remains unobscured by ordinary status cards.
- Phone (390×844): stable 74svh scene across journey/combat/Warden states; map remains optional below the actual 3D arena; focus-health strip is visible over lower arena without resizing the canvas on encounter changes.
- Narrow phones (320–359px): two-row navigation maintains 44px minimum control targets without horizontal button spill.
- Clean view: removes ordinary panel, quickbar and danger chip; connection failure and terminal result remain visible.
- Focus: quickbar delegates to actual hero selection; hiding the interface moves any focus stranded in hidden panels onto the visible HUD toggle. Journal returns focus to the opener.
- A polite, visually hidden live region announces important newly verified danger transitions only once per same run/floor. It does not announce each countdown change.
- Text and shape signal danger, shield, portal and resource states even without color. Reduced-motion CSS remains in place.

## Engineering and resource bounds

- At most **three keyed quick-focus buttons** and three HP tracks; same DOM nodes updated on snapshots, not recreated at each tick.
- At most nine journal records, regenerated only on event signature change. Recent outcome only one bounded text note, source text set with `textContent`.
- One read-only danger/progress projection, no new simulation ticks, random calls, WebGL meshes, VFX, sound synthesis, polling loops or canvas-resize handlers.
- Existing polling and watchdog intervals are reused. Log emission on repeated fetch failures is bounded rather than every 190 ms.
- No public exposure of raw module failure text; browser console retains diagnostics for operators.

## Verification and honest outstanding evidence

- Exact repository source was parsed in the review environment: 13/13 syntax/markup/contract checks passed (app, spectator module, watchdog, test syntax, target IDs, screen-size CSS, lack of fake progress/strike label and suite registration).
- Read-only projection contract examples were executed against the exact `spectator-ui.js` source: danger without a fabricated warning, validated marked cells/attack tick, correct Warden release label, portal availability from actual enemy count, stale outcome suppression.
- The exact startup watchdog source was exercised under a deterministic timer/DOM-signal harness: 5/5 checks passed for initial loading, frames-only not ready, verified render+tick ready, WebGL loss and cold-start failure. **These are simulated inputs, not running-game evidence.**
- Browser specs are committed for actual `DungeonRuntime` snapshots, live advancement, Warden telegraph and release, focus and checksum preservation, 1440/390/320 layouts, audio opt-in, journal and disconnect recovery.
- Expected capture outputs on successful browser execution: `artifacts/dungeon-spectator-*.png`. **No claim is made that fresh exact-head screenshots/videos were captured or inspected.** GitHub Actions jobs were queued in this working session; a queued job is not a pass.
- No blind reference comparison, assistive-technology device test, video-compression readability check, long-haul stream/canvas budget measurement or original-audio sync receipt has passed. Do not describe this PR as AAA, transformed or production ready.

## Integration and next gates

1. Keep this PR draft and periodically reconcile the concurrent PR #49 head without overwriting independent environment, rendering, camera, animation, audio or gameplay work.
2. Obtain successful exact-head foundation and browser runs. Inspect individual real screenshots and traces at 1440×900, 390×844 and 320×740. Reject if overlays cover a real sword/actor, the screen scrolls horizontally, or the canvas reallocates across stage changes.
3. Confirm genuine loading → live → warning/recovery → defeat/restart → disconnection/recovery sequences with rendered WebGL, measurable accessible focus changes and checksum unchanged by all spectator controls.
4. Audit legibility in a low-bitrate broadcast, keyboard navigation, screen-reader status frequency, touch targets, reduced motion, and no hidden state left after an autonomous restart.
5. Require independent quality review before integrating; retain all unfinished gates as open.

**Rollback:** revert the Session 9 HUD branch commits only. No saved-game migration, authority version change or main-branch rollback is required.
