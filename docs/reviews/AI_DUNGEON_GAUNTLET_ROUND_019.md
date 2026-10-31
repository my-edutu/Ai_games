# AI Dungeon — Gauntlet Round 019: Physical Wall Silhouette Breakup

**Branch:** `feat/ai-dungeon-3d-gauntlet-foundation` · **PR:** #49 (draft) · **Date:** 2026-10-31.

## Gap and quality bar

Round 18's authentic browser screenshots show repeated ruler-straight, uniformly tall rectangular corridors and low-detail characters. The primary comparison remains actual [Diablo IV gameplay](https://store.steampowered.com/app/2344520/Diablo_IV/) and [official environment gameplay](https://www.gamespot.com/videos/diablo-4-new-environmental-gameplay-showcase/2300-6457759/), with No Rest for the Wicked and Path of Exile 2 secondary. Reference art was not copied. The goal of this small increment is more physically varied masonry, not a false claim of comparable art.

## Test-first incremental implementation

1. Added focused pure-map RED tests before implementing the planner (3 failed because the module did not yet exist), then GREEN **3/3** under Node 22 on a local representative 19×19 grid. This isolated test is not a full repository or WebGL run.
2. Added a read-only deterministic wall-profile plan: exposed walls get bounded height changes across five bands (2.50–3.01m); buried wall tiles stay 2.60m. The collision grid, walkable cells, seed streams, combat, persistence and authoritative simulation remain untouched.
3. The existing instanced walls render their per-tile heights; decorative crowns/caps follow those heights. Existing multi-hero camera sightline cutaway also reads each wall/crown's actual rest height. No new geometry, draw calls, materials or external asset licenses.
4. Exposes actual renderer masonry metrics and adds a Chromium screenshot gate for exposed-wall variation and hero visibility. The dedicated browser workflow must inspect the **real** output file `artifacts/dungeon-wall19-world-only.png`, not a mockup.
5. Includes planner tests in `npm run dungeon:test`; the standalone new route is explicitly allowed by the CSP-constrained stream server.

## Evidence ledger and critic

**Implemented; full repository/Chromium/seed campaign results not yet established at this document's creation.** Actual before/after screenshots at equal seed and camera have **not** been independently viewed. New browser workflow and complete CI must run before any numerical renderer claim. No independent worker or ultracode was available (worker tunnel disconnected), and no blind matched A/B was performed.

**Harsh self-critic:** height variation alone does not produce carved natural stone, layered rooflines, or high-end asset material sophistication; the regular grid and low-poly heroes remain obvious. Next biggest blocker: artist-quality hero/enemy rigs, procedural wall contour/stone face treatment, authored animations, and professional 3D performance/visual comparison. Diablo IV fidelity **NOT MET**, production readiness **NOT MET**, leave draft PR open. Roll back this increment by reverting its cohesive commit. Retain exact-head video/screenshot artifacts and update this report/ledger only after tests complete.
