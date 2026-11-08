# Pass211 — verify the actual PUBLIC pressure hinge, not just rendered frame counts (2026-11-08 UTC)

**Existing branch:** `feat/maze-3d-gauntlet`, open draft PR #53. **Fixed reference:** official Captain Toad: Treasure Tracker gameplay, with Luigi's Mansion 3 and ASTRO BOT as secondary supporting quality references. Benchmark **NOT MET**.

## Source-proven visual evidence failure

Pass210 preserves one WebGL canvas during authentic approach → pressure → withdrawal. But it accepts ANY new render frame, including the first warning frame in which the real ivory shutters are still closed and the two physical jaw hinges have barely moved. A three-image sequence could therefore be labeled continuous without actually demonstrating the causal animated mechanism. Its existing `trapJawOpenMaxRadians` measures the *maximum over every trap*, which can falsely attribute another visible trap's hinge movement to the photographed one.

## Smallest worthwhile fix

The original production 3D world now exposes a read-only diagnostic list of **only currently visible, public** pressure mechanisms, with each modeled cell's real pressure progress and **its own** pair of physical hinge rotations. No hidden or remembered-only cell and no terminal state is exposed. It is not a new gameplay rule, visual overlay or AI authority. The source-bound Playwright screenshot chronology now requires the photographed public cell to show an actually opened >0.60-radian hinge at pressure progress >=0.68, and to return to <=0.21 radians / <=0.20 pressure on approach/withdrawal. It continues to require the same canvas, original run token, real published ticks, advancing renderer frames, unaltered full-frame native 320/390 screenshot SHA-256 sidecars, unchanged ±0.95 physical framing, 390 Pip width >0.49, jaw width >0.70 and 44px controls. Independent critics can use the per-cell sidecars to reject a still-inert sequence.

## Verification and limits

Code changes are candidate evidence infrastructure, **not a rendered win**. Direct coding/critic tunnels returned `NOT_FOUND` and exact-HEAD GitHub WebGL and whole-repo CI for Pass210 were queued when checked. Both modified JavaScript sources passed independent V8 syntax parsing; no installed Three/Playwright runtime pass, native current-HEAD images, six-run geometry proof or independent Nintendo reference approval is claimed. Preserve all privacy, reset and accessibility requirements. Do not merge, deploy, force-push or lower thresholds. Resume the actual scene/gameplay critique when exact-HEAD native evidence is available.
