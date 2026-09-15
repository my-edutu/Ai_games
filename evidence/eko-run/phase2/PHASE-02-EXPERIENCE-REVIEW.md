# Eko Run Phase 2 — Mechanics-Only Experience Review

## Review mode and scope

**Candidate:** `af9d322115cd9c187d78823fd43bce0f938a3784`  
**Scope:** deterministic precision-movement graybox only  
**Stop-ship verdict:** **PASS for Phase 2 scope — no unresolved stop-ship/P1/P2 finding**

Phase 2 intentionally has no character mesh, costume presentation, animation clips, Three.js world, final camera, Lagos art pass, hazards/traffic, HUD, audio, or mobile presentation. Those categories are still scored below because the Eko Run experience gate requires the full 100-point rubric, but an absent later-phase system receives `0 / deferred`; it is not represented as already reviewed or complete.

The mechanics-only implementation plan explicitly states that presentation remains absent from this gate. Representative play is therefore evaluated from authoritative 60 Hz simulation trajectories, semantic movement events, immutable snapshots and deterministic scenario replay. Slow-motion diagnosis is performed by tick-by-tick stepping of the same authority rather than by slowing a renderer that does not yet exist.

## Representative moments reviewed

| Moment | Normal-speed review | Slow-motion / frame-step diagnosis | Result |
|---|---|---|---|
| First 30 seconds / ordinary traversal | 900-tick control stress contains acceleration, reversal, jumps and slides at 60 Hz authority | individual movement/collision tests inspect state transitions and timers per tick | pass for mechanics scope |
| Maximum-speed movement | sustained directional control reaches bounded configured speed | swept collision tests inspect wall/route-bound contacts | pass |
| Chained jumps | repeated jump events in the 900-tick control stress | coyote, buffer, release and landing transitions inspected per tick | pass |
| Large fall / landing | deterministic stumble scenario starts from an 8-unit fall with -13 vertical velocity | landing/stumble timers and automatic recovery inspected per tick | pass |
| Moving outcome-critical geometry | moving-solid scenario and adversarial moving obstacle cases | previous/current collider positions and sweep crossing are inspected per tick | pass |
| Near-miss / authored hazard | not implemented in Phase 2 | deferred to Phase 4/5 | 0 / deferred |
| Hit reaction | no hazard-hit system in Phase 2 | deferred to Phase 5 | 0 / deferred |
| Death / restart | kill-plane failure and restart contracts are covered by Phase 2 recovery tests | lifecycle, movement state, spawn support and timers are inspected on exact ticks | pass |
| Costume variants / silhouette | not implemented in Phase 2 | deferred to Phase 3 | 0 / deferred |
| Mobile viewport / HUD | not implemented in Phase 2 | deferred to Phase 7/11 | 0 / deferred |
| Low-performance presentation mode | no presentation layer in Phase 2 | authoritative mechanics performance is measured separately and remains presentation-independent | mechanics pass; presentation deferred |

## Required finding contract summary

Material defects discovered during the three review passes are recorded in `PHASE-02-REVIEW-1.md`, `PHASE-02-REVIEW-2.md`, and `PHASE-02-REVIEW-3.md` using the required `Moment → Expected → Observed → Why → Severity → Exact improvement → Verification test` contract.

The resolved stop-ship/P1 classes were:

- vault body-path clearance;
- moving-solid overlap and full between-tick sweep;
- restart support selection beneath overhead geometry;
- move-command authority/audit disagreement;
- player full-body route bounds;
- slide-to-jump collider expansion beneath a low roof;
- fail-closed snapshot body-bound invariants.

The coyote-time evidence gap was closed with real walk-off-edge traversal rather than injected state.

## Obstacle / fairness table for Phase 2 geometry

Phase 2 has no Lagos hazard classes. Its graybox solids are collision fixtures, so fairness is evaluated as movement legality rather than warning art/audio.

| Geometry class | Decision cue | Legal response | Collision truth | Recovery / failure |
|---|---|---|---|---|
| Tall solid / wall | geometry occupies forward body path | stop, reverse, jump if clearance/height permits | swept horizontal collision blocks tunnelling | control remains legal |
| Low step | support rise at or below configured step height | continue traversal | deterministic support snap | grounded control retained |
| Tall step | rise above configured step height | stop/jump/turn | treated as blocking solid | control retained |
| Ceiling / low roof | standing/rising body clearance unavailable | remain low / delay jump | upward velocity or body expansion cannot penetrate | buffered jump may execute after legal clearance |
| Vault-eligible low obstacle | explicit low obstacle plus forward intent and `vault` input | vault or avoid | deterministic bounded path must remain clear for full body | vault rejected if path becomes illegal |
| Moving solid | deterministic current/previous collider path | avoid or be displaced by legal contact | overlap and swept crossing are resolved deterministically | player separated to legal route-bounded position |
| Gap / kill plane | support ends; falling state begins | jump within legal timing or fail if unrecovered | support/coyote/kill-plane truth is authoritative | bounded coyote window, then gameplay failure/restart |

No Phase 2 test permits “realistic chaos” or presentation ambiguity to excuse an unavoidable collision.

## Camera-causality review

Final camera is not implemented and therefore receives `0 / deferred`. Phase 2 nevertheless proves the controller does not depend on camera/render sampling: identical authoritative input streams produce the same authority under 30/60/120 presentation sampling schedules. Any later camera-caused failure remains a stop-ship owned by Phase 4+ and cannot be waived by this result.

## Costume / silhouette review

No character mesh, animation clip or costume exists in Phase 2. Character/art-direction and animation categories receive `0 / deferred`. Phase 3 must independently prove equal collision truth and readable silhouettes for all outfit families.

## Lagos identity review

Lagos visual, spatial, soundscape and cultural identity is deliberately absent from the mechanics-only graybox. World identity receives `0 / deferred`, not a false pass. Phase 4 and later remain responsible for proving that Eko Run is recognizably Lagos-inspired without weakening control readability or fairness.

## Accessibility and mobile review

Input authority is normalized and deterministic, but final touch controls, captions, reduced-motion alternatives, safe areas, HUD and mobile presentation are not implemented. Accessibility/mobile receives `0 / deferred`. No Phase 2 claim closes later accessibility requirements.

## Performance consistency

Exact candidate CI artifact for `af9d322115cd9c187d78823fd43bce0f938a3784` measured 1,051 authoritative ticks:

- p50: `0.127176 ms`
- p95: `0.258741 ms`
- p99: `0.321217 ms` against `< 4 ms`
- worst: `0.443234 ms` against `< 16.67 ms`
- deterministic repeat: pass
- snapshot/restore continuation: pass
- uninterrupted/restored checksum: `5001c2e0f4caae6c`

Performance spikes therefore do not change control truth in the measured Phase 2 mechanics corpus.

## 100-point experience score

| Category | Max | Phase 2 score | Reason |
|---|---:|---:|---|
| Movement & controls | 15 | 15 | acceleration/braking/air control, coyote, buffer, variable release, slide, vault and recovery are deterministic and adversarially tested |
| Character animation | 12 | 0 | deferred to Phase 3 |
| Character / art direction | 10 | 0 | deferred to Phase 3 |
| Camera | 8 | 0 | deferred; render schedule independence only is proven |
| Level / obstacles | 12 | 10 | graybox steps, slopes, walls, ceiling, vault block, gap and moving solid validate traversal mechanics; authored levels are later |
| Readability / fairness | 10 | 8 | authoritative geometry response is predictable; final visual/audio cues and Lagos hazards are later |
| World identity | 10 | 0 | deferred to Lagos vertical slice |
| Game feel / audio / VFX | 8 | 0 | deferred to presentation phases |
| Emotional pacing | 5 | 1 | recovery/stumble contrast exists mechanically; authored pacing is later |
| Spectator / replay value | 5 | 4 | deterministic replay/checksum/snapshots are strong; spectator presentation is later |
| Accessibility / mobile | 3 | 0 | deferred to input/presentation work |
| Performance consistency | 2 | 2 | exact-head mechanics timing is far inside budget |
| **Total** | **100** | **40** | low total is expected because Phase 2 intentionally excludes presentation/content categories |

**Interpretation:** `40/100` is not a production-quality game score and is not presented as one. It is the honest full-rubric score of a mechanics-only phase. Phase 2 passes because its explicitly owned movement/collision scope has no unresolved stop-ship and satisfies its specialized gate; later phases must raise the deferred categories before any broader experience or production-readiness claim.

## Regression evidence required and present

- initial Phase 2 movement RED corpus before production implementation;
- Review 1 adversarial RED corpus before fixes;
- Review 2 adversarial RED corpus before body-bound fix;
- Review 3 adversarial RED corpus before final collision/invariant fixes;
- final exact-candidate dedicated Phase 2 workflow green;
- final exact-candidate full catalogue workflow green.

## Final Phase 2 experience decision

**PASS — mechanics-only precision movement scope.**

This decision does **not** approve animation, camera, art, Lagos identity, hazards, audio/VFX, HUD, touch/mobile presentation, accessibility presentation, AI/autoplay, viewer interaction, economy, reliability soak or production readiness. Those remain future phase gates and may still reveal stop-ship defects that require controller changes.
