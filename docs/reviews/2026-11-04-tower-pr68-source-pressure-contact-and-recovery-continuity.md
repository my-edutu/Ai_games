# Infinite Tower Climb — source-confirmed pressure encounter: warning → strike → mechanical release
**Date:** 2026-11-04 · **Scope:** Existing draft PR #68, same full-game transformation initiative · **Experience verdict: NOT EVALUATED**

## The systemic gameplay-facing defect

In the existing playable 3D tower, a hazard acquired 16 substantial mechanical chamber parts during the real 12-tick warning. But at the exact fixed-step source transition to `hazard.active: true`, the chamber disappeared. The existing active collider visual in `world.mjs` raised its teeth, so the independently authored anticipatory geometry appeared to evaporate on actual contact rather than strike and release. For a portrait viewer following an autonomous double-hazard escape, the same pressurizing machinery failed to connect anticipation, impact, survival and environmental recovery.

This continues **one cohesive 3D expedition transformation**, not a new success metric. The upstream 3D tower provides the playable climb, world and guardian, while PR68 also contains route/arrival and moving-deck architecture, multi-hazard AI decisions, physical warning geometry, guardian combat feedback and authentic terminal/restart staging. This run closes the causal **danger phase** within that same slice.

## Implementation — physical source continuity, not another overlay

- `public/infinite-tower-climb/visuals/hazard-pressure.mjs` retains the same original **16-assembly chamber** and a single instanced draw, up to 6 chambers in normal quality / 3 on low. It uses actual fixed-step `chargeTicksRemaining` to close while warning, **stays fully closed at observed `active === true`**, and changes its source-contact alloy tone to distinguish the strike without a flash. The geometry itself is fully closed, so color is not the sole danger signal. This stage does not own or alter hit boxes, terrain, random numbers, AI commands, physics or recovery.
- For a **genuinely observed adjacent active→inactive** source transition, the pressure rails and counterweights unload over up to 6 additional **source ticks** (not wall-clock/render frames), cooling to neutral steel and physically reopening. An inactive first frame, missing hazard, floor/run change, stale or terminal snapshot, nonadjacent gap or backwards replay cannot manufacture that cue. Reduced-motion mode holds an open static recovery pose.
- Source-active hazards always receive a 3D draw slot first, ahead of warning and safe mechanical recovery on crowded low-tier scenes. During a real guardian windup, lower-priority anticipation and recovery yield, but a physically **active trap stays visible**.
- `public/infinite-tower-climb/visuals/audio.mjs` integrates an optional, restrained mechanical disengagement sound *only* when the same adjacent public source history proves a nearby live attack ended and the protagonist survived. It remains subordinate to real hazard alarms/strikes, uses existing mute/gesture gating, no new audio assets or calls to simulation, and is not a reward or heal cue.

Changed 3D/gameplay source is **actually wired** through the current `scene.mjs` stage instance, update, context recovery, diagnostics and lifecycle teardown; this is not a separate illustrative demo. The authoritative generator/physics/replay files and the frozen baseline are untouched.

## Behavior contracts & internal validation

`tests/phase3/tower-authentic-hazard-pressure.test.cjs` now asserts:
1. Last fixed-step warning posture and first actual live attack produce identical physical closure, visibly different source-strike color, no authoritative mutation or extra draw.
2. Observed active→inactive retains pressure then opens for a bounded source-tick aftermath, remains identical on duplicate frame, clears on expiry, and is never fabricated by an inactive first frame or source discontinuity.
3. When there are six warnings plus one active real threat, low quality renders the real strike first and only two warnings; guardian charge cannot suppress actual active danger, while stale/result/restart clears it.
4. Audio cannot represent a result without adjacent strict active→inactive boolean observations; prior old fixture that expected *active collision itself* to be hidden is corrected, not diluted.

Technical commit sequence: [tests](https://github.com/my-edutu/Ai_games/commit/562696b2d0f5a081c5ccfb1d026ea7664ba5d464), [3D phase implementation](https://github.com/my-edutu/Ai_games/commit/7bec8887d65f9f372faf26c93897ba10a703aa6f), [audio proof tests](https://github.com/my-edutu/Ai_games/commit/a001494c5bace4d5a271919ab28dc96953693707), [source-verified recovery SFX](https://github.com/my-edutu/Ai_games/commit/bbbe3f083793300bb2921358159403da35a5c76f), [fixture repair](https://github.com/my-edutu/Ai_games/commit/3b99ca85d76d32c9a775a931f0ad44a51d36be6e), [stable render phase/instance buffer budget](https://github.com/my-edutu/Ai_games/commit/4500fca94a8a064c7c0a45af09d301033da9f18f).

The previously verified source **d407be7** had a successful technical contract at [41809433350](https://github.com/my-edutu/Ai_games/actions/runs/41809433350), which does **not** verify these changed sources. This implementation's CI/capture is queued/in progress at inspection: [quality](https://github.com/my-edutu/Ai_games/actions/runs/41816549384), [actual native gameplay capture](https://github.com/my-edutu/Ai_games/actions/runs/41816549404). Do not infer pass from submission.

## Source-authentic film and independent experience evidence — not a claim of improvement

Prior [41809316245](https://github.com/my-edutu/Ai_games/actions/runs/41809316245) completed 9/9 native desktop/portrait real-game source-pinned recording jobs for baseline `1731b380851162741761c5569e2bc152a0869ca9` and previous candidate `8f61ef18...`, including ascent, moving, danger and outcome. These authentic videos **predate this implementation**; the event/tick episodes have not been independently matched and examined as full-motion A/B. A completed capture job proves video creation, not cinematic quality, visual readability or a true new-source preference.

The independent worker/browser environment returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`, so no new-source real native full-motion clips could be directly watched here, no randomized blind reviewers could be recruited, and no supported-device frame-time p50/p95/p99 or memory could be measured. **All LOOKS/FEELS/PLAYS votes remain 0/5 genuine independent reviewers, not scores of zero quality.** Still need event-matched unedited >=60-second baseline/candidate desktop 960×600 and portrait 390×844 scenes for (a) ordinary ascent, (b) simultaneous trap+guardian crisis, and (c) genuine result and restart. All must be watched in motion by fresh independent critics.

## Separate reviews

**Spec/compliance:** The public authoritative snapshot determines every rendered danger phase; bounded source-tick presentation neither forecasts safe lanes nor mutates rules, seeded randomness, replay or lifecycle. Original host remains pinned. Muted/reduced-motion and bounded low-tier graphics have explicit code paths; technical CI must still prove them on exact head.

**Hostile experience critic (builder-side, NOT blind):** A closing 3D machine may now be legible through actual impact, but the extra active hardware can also cover a narrow cropped climber or guardian. Strike tint alone may be insufficient in dark/mobile scenes; dense hazards might visually compete with selected destination. This is an open P1-equivalent risk until actual native raster is watched at normal speed. If crowded, simplify the physical stage rather than adding HUD or distorting simulation. Authentic event alignment and guardian/hero on-screen silhouette still rank ahead of sculpture detail.

**Performance/ownership:** Same one instanced mesh and draw, maximum 96/48 source-timed pieces, stable phase array, no new postprocessing/light/audio buffers or external input. Source history bounded to currently displayed active/recently releasing hazard IDs, freed on lifecycle loss/restart/context recovery/dispose. Costs and device frame-time tails have **not** been measured: no sustained-FPS claim.

**Privacy/security/recovery:** No new external events, network, cookies, analytics, user data or user-supplied assets. Renderer-only event response and muted optional audio; stale and terminal footage clears the stage. Restored graphics recreates its owned material/geometry and latest source rebuild.

## Unresolved and next decision

**QUALITY: NOT EVALUATED**. Frozen source SHA `1731b380851162741761c5569e2bc152a0869ca9`; do not move it. Current transform remains open in draft PR68; PR58 remains concurrently active and untouched. No merge, force push or deployment.

The largest remaining experience gap is **source-matched full-motion viewer comprehension**: is the active climber, both real traps, guardian and destination clear enough on mobile for an uninstructed viewer to understand risk and consequence? Inspect current-source capture metadata and watch actual native films; then obtain at least five independent fresh-context A/B judgments each for LOOKS/FEELS/PLAYS, at least four candidate preferences each, and real supported-device frame-time tails/memory and accessibility/replay/recovery. CI remains a safety veto, never a Gauntlet experience PASS.
