# Game 9 — Round 33 Raised Stone Floor Materiality

**User intent:** Make Game 9 a full 3D dungeon experience with believable distinct environments, readable characters and professional scene/UX. Continue prior Gauntlet loop, without claiming Diablo IV visual parity.

**Observed evidence:** Authentic Round 31 browser raw-world capture still shows regular, extremely flat blue-grey floor tiles, making rooms look like miniature blocks. Round 32 already added a separate render-only wall-weathering system; this design targets the walkable floor surface without interfering with its wall geometry.

**Approaches considered:** An external premium environment asset pack would risk licensing and break grid alignment; a canvas texture recolor cannot show real shadows or stone depth. **Chosen approach:** Original, shallow, asymmetrical raised stone pavers and modest biome-specific damp patches instantiated in two GPU batches. Low geometry, no dynamic lights, shaders or collision; world coordinates derived deterministically from existing public snapshots.

**Invariants:** The authoritative map, routes, agents, hits, camera target and replay are unchanged. All pieces stay under ankle height; no start/exit damage or opaque overlays, max 144 pavers and 22 damp patches, two new draw calls, disposable geometry/materials, four biome-specific finishes and no external assets.

**Acceptance:** Pure planner tests are deterministic across real seeded maps, respect safe buffers and caps, reject malformed grids; browser actually renders 3D and diagnostics show nonzero geometry, existing heroes remain visible at 1440×900 and 390×844. Capture actual world-only and mobile screenshots and compare honestly against baseline. Production and benchmark parity require independent further evidence.
