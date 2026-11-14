# P0 — Source-owned lean passage rendering and authentic native doorway veto (2026-11-14)

## Active evidence, not acceptance
PR #68 on PR #58, draft. Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9`, unchanged.
Latest inspected source: `b88a5dd9f003af64a414225e62fed9c95e35e243`.
Production repair: `bf8cf3578e830d4bad3c491a2f0660c6641b1421`.
Test-first regression: `305f1b756e722e84c069050e465f238edf75bbad`.

The completed [nine-job previous source-pinned capture](https://github.com/my-edutu/Ai_games/actions/runs/43637192124)
produced eight original video/event pairs (candidate `18751c075055fcf58446c9fe9ab20cbc6edac942`).
I opened original unedited 960x600 and 390x844 danger recordings; both still REJECT
strict one-shot original bronzed gateway -> first real Floor9 runway acceptance (0/2).

- Real guardian HP0 source victory: tick 441; actual Floor9 crossing: tick 475.
- Desktop: source clock t=24.607s; original native Floor9 HUD appears near 26.0s,
  violet scene phase 26.5s. Portrait: source t=24.796s, HUD around 26.0s,
  violet at 26.75s. Original unedited native pixel appearance is not proven
  by first safe WebGL source projection at tick 475/476.
- Both original capture files have two returned original-gateway projection witnesses
  (original retained GPU true, hero and gate NDC safe), but visible new-world hard cut.
- Browser renderer-submission intervals (hosted software capture, NOT device FPS):
  desktop p50/p95/p99 = 93.3/271/691.9ms; portrait = 87.2/203.3/355.1ms.

## One main-thread system repair
The previous frame/camera/world path performed **18 full passage.diagnostics() evaluations
in ordinary hot-path controllers** and three more in optional forensic scope.
Each full report allocates nested arrays, mesh/collision metadata and vectors
for 3D gateway geometry, while camera/lighting/world merely consume a small
set of source-bound stage and passage fields. At software-capture cadence,
repeating these deep allocations aggravated the already significant
source-to-visible-frame backlog.

- New `passage-live-witness.mjs` exposes one guarded, source-proven,
  defensive-copy payload for stage, run/floor/tick, old passage visibility,
  grounded handoff clocks, gateway focus, and inlay progress.
- `guardian-passage.mjs` exposes `liveWitness()` without changing lock,
  unlock, begin, trackSuccessor, collision, source HP-zero, or full
  `diagnostics()`. Stage cannot fabricate a handoff when inactive/locked.
- `scene.mjs` shares one such payload before world.update, refreshes it
  exactly after the real passage.update, and passes it to the actual
  camera, horizon and framebuffer/retained-world subsystems.
  New ordinary-frame full forensic allocations: **zero**. The complete
  read-only `window.__TOWER_RENDER_DIAGNOSTICS__` audit remains unchanged.
- Four local pure source contract tests passed. New test-first structural
  hotpath veto failed before the production change, as expected.
  This is code-path evidence, not proof of FPS, gameplay, or pixels.

## Unverified acceptance
Exact-production quality workflow:
https://github.com/my-edutu/Ai_games/actions/runs/43644966654
Candidate source for new capture: immutable GitHub SHA of the finalized
capture-request evidence commit. Await new 9-job source/video event match;
do **not** mark P0, P5 or P6 passed based on green CI or a low CPU count.

**Next largest action:** inspect exact-source CI and the next full original
baseline/candidate recordings. If actual bronze gate / hero / Floor9 platform
still fail one contiguous shot, prioritize shared old/new world residency
and compositor frame pacing with explicit drawn-pixel evidence rather than
new fade layers or another isolated test-count increase.

Independent LOOKS 0/5; FEELS 0/5; PLAYS 0/5.
Physical device frame-time and memory: NOT EVALUATED.
Overall leading transformation verdict: **NOT EVALUATED**.
No force, merge, deploy, PR58 edits, frozen baseline alteration,
other-game edits, or draft-status change.
