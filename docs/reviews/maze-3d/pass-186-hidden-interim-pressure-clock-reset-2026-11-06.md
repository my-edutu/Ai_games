# Pass186 — hidden public ticks cannot resurrect a fully raised pressure piston (2026-11-06 UTC)

## Source-confirmed physical encounter defect

The existing witnessed bronze warning → ivory shutter → pressure piston is a real, publicly triggered Three.js encounter. Before this change, the pressure clock reset on the next `animate()` when a hazard became hidden, or on certain object rebuilds. A hidden-then-visible public pair arriving between render frames with unchanged known objects could therefore skip both preliminary physical beats and present an already-extended piston. This is an in-scene gameplay continuity/privacy problem, not a HUD tweak.

## Implemented production fix and regression candidate

Each `world.update()` now invalidates both timestamps for hazards **absent from that incoming PUBLIC `visibleCells` list**, even if the object cache key does not change and the browser is paused between renders. The currently witnessed near-contact stage continues unchanged; an unseen interval always requires a fresh visible relay/shutter/piston sequence. No hidden topology, engine damage/collision, autonomous decision, GPU allocation or camera framing was changed.

The new installed-Three.js test first drives the original live pressure meshes to full extension; sends hidden then visible public snapshots **without any intermediate render or object rebuild**; asserts the same piston and shutter objects restart physically in the warning pose; then verifies a real sustained pressure can again finish, and the world resource counts never grow. This would fail against prior commit `bbf9ac1`.

## Acceptance boundary

The shared coding workspace and independent worker service still return `NOT_FOUND` (disconnected tunnel). **Installed-Three execution, the current-head six-run <100 geometry gate (previously 102), complete native Playwright WebGL screenshots and independent Nintendo critique are NOT proven.** Older original 37-shot WebGL evidence on `897d25f` cannot approve the new code. Retain existing 320/390/844/1280 full-frame strict ±0.95 NDC, withdrawal width ≥0.70, 44px input, accessibility and public-knowledge protection. Source verified for coherent logic only.

Official [Captain Toad: Treasure Tracker](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) gameplay/visual bar **NOT MET**. Keep [draft PR #53](https://github.com/my-edutu/Ai_games/pull/53) open, unmerged and undeployed. Run strict exact-head CI/render gates before any claims of completion.
