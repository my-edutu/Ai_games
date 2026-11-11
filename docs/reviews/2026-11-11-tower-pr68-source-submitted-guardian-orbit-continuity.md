# PR68 P0 — original portrait guardian submitted-camera continuity

**Stage:** P0 EVIDENCE + GAME-LOOP TRUTH — OPEN. **Leading transformation assessor:** NOT EVALUATED. **Frozen playable baseline:** `1731b380851162741761c5569e2bc152a0869ca9` (untouched). Scope: existing draft PR #68 only, never PR #58/main or other games.

## Original-source evidence reviewed before implementation

- [Latest immutable source-pinned 10-job capture](https://github.com/my-edutu/Ai_games/actions/runs/42950958038) is **SUCCESS** at candidate `653fa1c64d6b8c37f975f8e30b763e98aaeb7190`; all eight original baseline/candidate scenarios captured at 960×600 and 390×844, with the original 20Hz simulation. [Paired source/video event index](https://github.com/my-edutu/Ai_games/actions/runs/42950958038/artifacts/13825375449) reported **8/8 source timeline pairs / zero integrity failures**. This confirms recording/provenance only; it does NOT independently certify game-to-pixel correspondence or quality.
- [Authentic 390×844 candidate danger film](https://github.com/my-edutu/Ai_games/actions/runs/42950958038/artifacts/13825147332) runs ~73 seconds. Direct frame inspection at native movie seconds 19–25 shows the real blue climber and bronze guardian on the cap platform, but its changing foreground framing, circular machinery and large camera swings make the guardian/hammer encounter less coherent. The source-driven floor-nine scene appears around movie second 25.5; a cut to the next floor does NOT by itself prove that the walkable threshold crossing was visually understood.
- Source-indexed camera diagnostics show approximately `-49.3°` to `+50.5°` between consecutive ~1-second original guardian observations near the live boss; another large change occurs around the initial confrontation. These are source/camera observations, NOT accurate measurements of frame-by-frame angular velocity or event-aligned native PTS. The event-index's direct event-pixel certification remains **NOT EVALUATED**. Continuous live-motion randomized blind judgment has NOT occurred.

## One systemic intervention: actual last-submitted live-guardian director

The previous guardian exterior standoff physically protected against the enormous near-camera armor seen in older film, but the earlier comfort orbit bound ran BEFORE downstream emergency camera, duel/landing and gateway corrections. It could therefore allow a new radically different but individually valid exterior shoulder at the very final submitted image.

The new implementation:
1. `guardian-camera-safety.mjs` adds a pure, radial-preserving short-arc `boundedObservedGuardianOrbit`, limited to live portrait camera and gaze, with a nominal 1.05-rad/s source-independent presentation angular rate and an explicit safe minimum annulus for gaze versus camera. Seam crossing follows the shortest exterior arc.
2. `scene.mjs` remembers the **last successfully submitted WebGL camera and gaze**, runToken, floor and tick. No attempted but failed WebGL render establishes history. During the source-authenticated **currently drawn, alive** guardian and compatible same-run source tick, it proposes continuity **after** existing emergency/airborne combat and gateway camera corrections. Neither the running game authority nor the authoritative actors are moved.
3. The capped proposal survives only when the real currently rendered protagonist and guardian projected full-height envelopes remain within portrait safe bounds, both genuine exterior core rays remain clear, and any **source-selected airborne touchdown** remains in frame and physically unobstructed. Otherwise restores the original higher-priority camera and gaze, preserving urgent gameplay rescue rather than creating a beautiful but false shot.
4. Records only internal `guardianSubmittedOrbitContinuity` capped/vetoed attempts and last source tick; these are engineering observations, not any quality, GPU FPS or hardware rating. Real mobile and desktop, reduced-motion and alternate overview remain protected.

**Commits (same PR68 branch):** policy `7f9affcfe91d0a01ac6796c9bc611bd49c1797a0`, annular focus `bae3ddcd3498bddde690c88ea258a1c7e5ab2e0b`, production scene `88ba6ba1df48936dcddff11909bdc2a23e8ad394`, focused regression `616497aa71e80e592924c373cc0a4491bfd452ea`.

## Verification and remaining vetoes

- The previous quality run [42950958039](https://github.com/my-edutu/Ai_games/actions/runs/42950958039) passed at the **previous** SHA. It does **not** validate these new edits.
- Exact-head Node/Three full suite and new source-pinned desktop/portrait 60+ second films of this implementation: **NOT EVALUATED** pending new workflows. The added focused source/policy checks are not claimed green until actually executed.
- Full **source video pixels** for guardian HP0/crusher→real grounded leaf crossing→floor nine→genuine result/intermission/restart: **NOT EVALUATED**. Old source events and source-backed animations alone cannot certify an understandable complete game.
- Real devices, graphics tiers, frame-time p50/p95/p99 and memory: **NOT EVALUATED**. Independently randomized blind full-motion LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**; minimum 4/5 candidate preferences in EACH is not met.

**Largest current experience gap:** Prove the revised final portrait camera improves continuous guardian combat **without freezing a safety rescue**, and that the true defeated-gate walk and floor-nine transition read visually. If still fragmented, reopen P0 actual living-body camera and threshold composition, not the capture harness. Then pursue the unfinished cohesive traversal/world/guardian and hardware safety stages. No merge, deploy, force-push or draft conversion.
