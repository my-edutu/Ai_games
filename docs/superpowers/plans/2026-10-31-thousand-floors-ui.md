# THOUSAND spectator interface upgrade

> For agentic workers: use executing-plans, test-driven-development, and verification-before-completion. Continue the user's authorized Game 4 UI improvement without changing simulation authority.

## Goal and design

Make the actual 3D explorer and upcoming landing the focus. Replace the pale full-screen wash and oversized information column with a compact, high-contrast expedition HUD. Keep floor, district, checkpoint, intent and playback controls legible. Move detailed progression into an explicit Journey dialog instead of putting another dashboard over the world.

Architecture: preserve every existing app.js element ID and event contract. Add a dependency-free presentation-only interface module reading the already-rendered floor, district, checkpoint and completed-floor values. No simulation, seed, save format, timing, camera projection, or character geometry changes. No invented stats, live-viewer counts or fabricated gameplay footage.

Tech stack: existing HTML, CSS and browser JavaScript; no new runtime dependencies.

Spec: docs/superpowers/specs/2026-10-30-thousand-floors-gauntlet.md. This is a presentation-only increment within its fixed benchmark, not a revised quality bar.

## Global constraints

- Preserve native settings/restart dialogs, error recovery, audio opt-in, scene review and clean-feed behavior.
- Fullscreen canvas stays untouched. Keep the center of desktop, portrait and landscape views free from persistent panels.
- At least 44px targets; no horizontal overflow at 320px, 390px, 844px landscape and desktop widths.
- Use only real rendered campaign values. Represent unavailable or invalid values as unavailable, not zero progress.
- Native modal keyboard/focus behavior; do not forward Journey key presses into gameplay shortcuts.
- Reduced motion and forced-color fallback. No external font or image downloads.

## Tasks

- [ ] Capture the existing HTML contract and add failing presentation tests for the Journey entry, compact layout and keyboard behavior.
- [ ] Rework index.html and styles.css; implement interface.js with read-only state synchronization and native Journey modal.
- [ ] Run browser UI-contract checks, inspect desktop/portrait/landscape output, and fix observed problems.
- [ ] Update the progress ledger and page with actual verification scope and remaining gaps. Publish to draft PR #55, never merge or claim the ASTRO BOT bar passed.

## Review focus

Loading/recovery must dismiss Journey before showing the retry action. Clean feed must retain a way to reopen settings. Long intent/district names and storage warnings must not collide with controls. Completion must distinguish arriving at floor 1000 from clearing all 1000 floors. Keyboard shortcuts must not operate behind an open dialog.

## Execution constraints

The connected coding workspace returned a tunnel-client offline error during this retry. A remote test sandbox could not be created with the connected account. Local Chromium is available. UI-harness results must be labeled as interface verification, not full-game, actual 3D performance or independent-critic evidence. Baseline head: e4c30451261cf75a4eea54dd5ed842f168f99c43.
