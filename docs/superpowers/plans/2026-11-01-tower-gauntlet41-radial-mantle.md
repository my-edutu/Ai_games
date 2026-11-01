# Tower Gauntlet 41 — Radial Mantle Continuity

> Existing Gauntlet goal and Round 40 failure are the approved design. Implement with TDD and visual criticism.

**Goal:** Remove the real tick-300-to-304 mid-air inward snap, without changing gameplay authority or adding on-screen copy.

**Architecture:** Retain the source-truth ledge eligibility and exterior contact radius. A presentation-only scalar director keys by run/floor/tick/checksum and allows immediate outward clearance, while bounding inward retreat to 0.55 units per authoritative tick. Repeated polls, new floor, restore, invalid input, and disposal reset safely.

**Files:** public/infinite-tower-climb/visuals/scene.mjs (single owner), tests/phase3/tower-radial-mantle-g41.test.cjs, tests/browser/tower-radial-mantle-g41.spec.cjs, existing ledge source contract, separate progress JSON.

**Checks:**
- [x] G40 evidence and current code inspected (real seeded tick 302 release radius 25 before landing).
- [x] RED observed before implementation; source-bound tests added, then 16/16 targeted GREEN.
- [x] Tower phase-3 test suite 142/142 and tower stream host self-test pass locally.
- [ ] Exact GitHub head CI and real desktop + portrait WebGL captures (submitted, still not proven).
- [ ] Fresh critic judges corresponding actual G40/G41 frames blind, plus moving footage.
- [ ] Full repo suite, physical GPU frame-time tails, 24h/72h soak, external readiness evidence.

**Non-goals:** authority/AI/physics/player speed/hitboxes/RNG/replay/progression, and new gameplay HUD information.

**Highest honest verdict:** specific radial source-level contract PASS; overall AAA benchmark FAIL/open until independent real gameplay evidence wins.
