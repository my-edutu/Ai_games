# Game 9 — immersive spectator interface, round 17

Continue the user's approved Gauntlet direction on the existing PR, not a new game. The primary reference remains real Diablo IV dungeon gameplay; supporting references are No Rest for the Wicked and Path of Exile 2. No preference win or independent review is asserted.

## Intent and constraints
The world, characters and immediate danger should dominate. Replace the dashboard-like composition with an original restrained fantasy HUD: charcoal surfaces, parchment text, brass accents and class-specific colors. Retain autonomous simulation, read-only snapshots, local assets, accessible controls and a separate development page. Do not change authoritative gameplay or save formats.

## Approaches
An additive CSS patch is smaller but perpetuates 36 KB of conflicting overrides. Rebuilding the renderer would risk simulation/presentation integration for little UI benefit. Chosen by the implementer: replace the spectator stylesheet, retain the game renderer and existing DOM contracts, add a small isolated presentation controller. The user delegated the approach and explicitly requested continuation.

## Acceptance
Desktop canvas covers at least 85% of the viewport; information overlays are restrained and avoid the central action. Mobile preserves a stage at least half viewport height and readable, full-width selectable hero cards without horizontal scrolling. Every touch control is at least 44 px. Clean view is reversible without pausing simulation. A keyboard-accessible journal shows bounded real events and returns focus on close. A map toggle works on narrow screens. Repeated ordinary events do not create central-screen alerts. Connection failure and terminal run states are explicit. Boss camera interpolation uses world coordinates and reset transitions cannot fly through the old floor. Keyboard shortcuts never intercept typing/modifier combinations. Contrast, reduced motion, native dialog focus, failed WebGL fallback and live source state are checked.

## Evidence contract
Use real browser captures, reproducible seeded snapshot scenes for exact UI regression, and separate live-runtime checks. Compare before and after at the same scene and size. Tests are not an artistic or AAA pass. External worker connection is offline; author self-review is explicitly not a fresh independent critic.
