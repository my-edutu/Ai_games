# Game 2 Pass52b — full-viewport public stage camera preservation (2026-11-01)

**Source candidate; exact-source native screenshots pending and frozen Nintendo Captain Toad reference NOT PASSED.**

The new active Pass52 action-first UI displays the actual WebGL canvas across the native 390×844 viewport rather than the older 366×520 in-page stage. Orthographic projection with fixed vertical half-height would cut the *horizontal* world span, clipping the already-disclosed gate and Pip or Thornback, defeating the more cinematic design. Preserve the old visually reviewed **.70 reference aspect** horizontal stage span only for Follow cameras on tall full-viewport phones; desktop, previous .70 portrait, Detail, Overview, small-height windows, AI, movement, gate authority, keys and public disclosure remain unchanged. Formula is bounded for tiny/invalid viewports.

Pure regression covers 390×844 world span for keyed gate, ordinary closed gate, and exploration, desktop and old portrait identity, NaN/zero/tiny aspect bounds. Existing true keyed gate browser gates still require both Pip and physical lock in view and in-frame margins; rather than relaxing them, they now require the correct full-viewport zoom band. A genuine source-bound screenshot with UTC/PNG/source SHA manifests must prove native legibility and compare to the frozen Nintendo imagery. Never claim a result from a geometry test or CPU-throttled SwiftShader timing.

Independent fresh-context critic/Ultracode remains unavailable due disconnected workspace tunnel. PR #53 stays DRAFT, unmerged and undeployed.