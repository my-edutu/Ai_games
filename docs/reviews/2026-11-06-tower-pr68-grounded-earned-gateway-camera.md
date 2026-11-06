# Infinite Tower Climb — PR68 P0: grounded earned-gateway continuous camera (2026-11-06)

**Stage:** P0 OPEN. **Transformation verdict:** NOT EVALUATED. **Source commit:** [5997c76b0317b76cf89dde878f0301ad11f22687](https://github.com/my-edutu/Ai_games/commit/5997c76b0317b76cf89dde878f0301ad11f22687). Frozen comparison SHA **1731b380851162741761c5569e2bc152a0869ca9** unchanged. Draft PR68 only; PR58 untouched; no merge, deployment or forced update.

## Most consequential observed problem, and action taken

Historical original-host candidate 8fd9018f portrait frames show the hero dwarfed by machinery at ~21–24 s, and floor-nine handoff around ~39 s without an unambiguously legible grounded door crossing. These are **historic frames**, not current-head gameplay verdicts. Earlier source changes established an earned floor-eight guardian/cap threshold and portrait/desktop gate gaze escort, but a full-cap panorama can still reduce the climber to a very small subject during the final actual walk.

The real Three.js `scene.mjs` now changes its **continuous exterior camera destination and gaze** during an authentic unlocked gateway promenade, guided by `observedGroundedGatewayShot` in `guardian-gateway-framing.mjs`. The shot requires the **same current run/floor**, defeated guardian + source cap, living standing climber whose feet are at the real cap top, and source-measured proximity to the 0.76-cap doorway. The lens approaches without crossing the solid core, uses separate portrait/desktop targets, yields to reduced motion and explicit zoom, and leaves all physics, enemy combat, AI, collisions, transition and rewards unchanged. The existing actor/camera rescue and earned-gate/core-sightline vetoes remain active. No new mesh/shader/light or render pass.

## Verification truth

- Local Node 22 reproduction of the pure candidate-lens helper: **3/3** source-shaped scenarios passed (proximity tighten, invalid source/unearned/airborne/dead cap rejection, portrait/manual zoom limits). This was **not** a checked-out exact-source test; the committed repository's four integrated `node:test` fixtures have **NOT RUN**.
- Exact-source [capture workflow 42170006093](https://github.com/my-edutu/Ai_games/actions/runs/42170006093) and [quality workflow 42170006059](https://github.com/my-edutu/Ai_games/actions/runs/42170006059) are **queued**, not passing. The older [nine-job run 42157788943](https://github.com/my-edutu/Ai_games/actions/runs/42157788943) likewise had nine jobs queued and zero artifacts at inspection. No new full-motion source-pinned desktop/portrait clips, actual source 3200-tick campaign or device measurements were obtained.
- Independent fresh-context blind reviewers: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Do not infer an improvement from code alone.
- Baseline frozen `1731b380851162741761c5569e2bc152a0869ca9`; PR58 branch not modified; no change to PR68's draft status.

## Separate specification and quality self-review

**Spec:** Only source-eligible unlocked physical cap movement can request a shot, so it cannot fabricate guardian victory, floor nine, a result, a climb or a restart; the source authority remains unchanged. Stale, different run, wrong cap, airborne, dead hero and manual zoom are excluded. **Not accepted:** no authentic crossing on current-source video.

**Engineering/experience risks:** A contracted goal camera may still appear to pump against the ordinary full-cap lens during rapid movement, crop distant landing information or place the real doorway behind other world geometry, especially in 390×844 portrait. The projection helpers' pure tests cannot adjudicate actual WebGL, input feel, occlusion, real-time motion or performance.

**Next highest-impact action:** get exact immutable SHA normal-speed WebMs for hero ascent, moving platform, guardian/crusher victory and genuine 8→9 walkway crossing into floor-nine onward landing plus game-kind outcome/restart, all same episode; inspect full motion against the frozen original host. If observed moving footage crops actual body or door, first fix continuous camera/orbit and foreground art; do not advance to P1 until P0 source/video gates pass. Then obtain matched independent blind votes and actual device frame-time/memory.

**Result:** Still **NOT EVALUATED**. No quality score, reviewer vote or successful current CI is manufactured.
