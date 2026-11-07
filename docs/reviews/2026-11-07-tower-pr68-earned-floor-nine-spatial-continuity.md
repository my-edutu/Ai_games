# P0 — physically continuous guardian passage into floor nine

Date: 2026-11-07. Branch: `feat/tower-transformation-gauntlet-20261101`, OPEN DRAFT PR #68. Scope: Infinite Tower Climb only. **Leading transformation verdict: NOT EVALUATED.**

## Source finding (not a filmed claim)

The source-earned upper-cap exit already required (1) a defeated live guardian, (2) grounded physical support on the cap and (3) the whole body beyond `guardianArenaClearanceX`. Yet the next-floor branch of `applyTowerAction` immediately reset `player.position.x` to the newly generated floor's constant `spawn.x=42000` and zeroed horizontal velocity. At the standard 480000-wide world and its cap geometry, the real cap crossing is approximately x=317896 or farther. The abrupt next-tick jump back to x=42000 could erase more than 275000 world units of lateral traversal in the actual 3D view. This is confirmed **from the rules source**, not by an exact-current full-motion capture.

This is an experience-level continuity defect independent of how attractively the doorway is rendered. Merely tightening the camera would not repair it.

## Vertical gameplay change

- Tests written first at `9ecadb7b52902aeaed354427dff63f4961e71490` (three original-runtime scenarios; **NOT EXECUTED** due unavailable Node22 project checkout and queued Actions workers).
- Source fix at `17df2cdd34945f00d93c268ed596a65c38ee9db8`: ONLY the already-authorized opt-in `guardianPassage` branch retains the proven crossing X on the next actual world-ground support, and carries bounded positive walking speed instead of restarting at the left wall with zero speed.
- Grounded support is assigned only if the new source-generated `f[nextFloor]:ground` is physically beneath the actor's feet and fully supports its width. The checkpoint inherits the new location rather than a contradictory remote X. A source `floor-complete` event exposes `gatewayArrivalX` for film/event alignment while preserving the existing `guardianPassage` contract.
- Missing/living guardian, airborne crossing, horizontal clearance and generated-floor validation remain prerequisites. Non-guardian and unflagged historical transitions retain their original spawn, velocity, ground state and original event shape.
- No synthetic teleport toward the door, forced guardian death, invented deck, change to camera-only evidence, RNG mutation, extra physics tick, free health, actor jump or result claim.

## Test and evidence status

1. Read AGENTS.md, binding design spec, GAUNTLET.md and current transformation.json; verified frozen baseline SHA `1731b380851162741761c5569e2bc152a0869ca9`.
2. GitHub connector successfully read and committed actual source and tests. Direct post-commit source retrieval confirms the changed `applyTowerAction` branch and actual test file.
3. Original Node22 `npm run test:tower:phase2`, full repository build, two unchanged 3,200-tick causal campaigns and source-authentic Chromium normal-speed captures: **NOT EVALUATED**. The project workspace tunnel returned `Tunnel-client has not been seen for 300 seconds`. Local container cannot resolve github.com. The latest earlier 9-job run `42368724802` is still queued (9 jobs, 0 verified artifacts), as is quality run `42368724834`; no new exact-source workflow runs were returned for the implementation SHA.
4. Historical portrait footage at source `8fd9018f` showed an undersized climber and unclear doorway/floor-nine progression. **No post-fix footage** yet proves that this source correction actually improves scene continuity, nor validates hazards/readability/restart.
5. Genuine independent randomized reviewer counts: LOOKS 0/5; FEELS 0/5; PLAYS 0/5. Supported-device frame-time p50/p95/p99 and memory: **NOT EVALUATED**. No transformation acceptance granted.

## Separate reviews

**Specification review:** Proposed change preserves the authoritative earned exit and frozen baseline; addresses a cross-floor physical continuity problem instead of weakening the floor gate. Code path is opted-in and continues into real next-floor geometry. Cannot close P0 until unmodified gameplay capture proves victory, crusher, cap, floor nine and real restart.

**Engineering/UX review:** Carrying X on the new ground should eliminate a conspicuous lateral snap, but may expose new routing from farther right and change actor/camera composition at the biome switch; both are exact-source campaign/video risks. The grounded handoff must survive the next real tick and retain a readable physical entrance. This is unverified. CI remains a veto, not a quality score.

## Next highest-impact action

Restore a genuine Node22 + Chromium repo checkout or available hosted runner. Execute `npm run test:tower:phase2` with the three new original-runtime fixtures, inspect deterministic replay and both untouched 3,200-tick campaigns. Capture SHA-pinned 960x600 and 390x844 normal-speed guardian/crusher → earned physical threshold → floor-nine onward → outcome/restart, alongside frozen baseline under matched seed/tier, each representative segment at least 60 seconds, event-aligned. Inspect whether actor silhouette, floor arrival route, next-floor hazards and camera transition are credible; fix the biggest real observed failure before attempting P1. Recruit five genuinely independent randomized blind reviewers for EACH pillar only when films exist. Do not merge, deploy, force-push, edit PR58 or change draft status.

**Protected:** baseline `1731b380851162741761c5569e2bc152a0869ca9` untouched; PR68 draft remains open, based on its existing PR58-ancestral history.
