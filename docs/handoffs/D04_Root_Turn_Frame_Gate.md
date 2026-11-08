# D04 — root-turn and real-frame hand-trail validity gate

**Status:** isolated opt-in candidate, **real Dungeon moving-video proof NOT verified**. Branch: feat/dungeon-d04-combat-feedback-realism-20261108. Frozen BEFORE milestone: 281735d0910c6b2443648af976003d50412ee324. Starting parent: e80a6b33a49bb471a3ca3479c8e6becf2ff655a3.

## Dominant inspected implementation defect

The previous measured hand ribbon subtracted only root *translation*. A real 90-degree root rotation could move a completely planted wrist by ~0.34m, pass the 0.025–0.38m eligibility window and draw a false blade stroke while the arm had not moved. Worse, the main browser deliberately capped animation delta to 50ms; a 380ms GPU stall was silently presented to the measurement gate as 50ms, joining unrelated wrist poses into a fabricated fast trail. This is a source-identified defect, **not** a claim of a defect observed in genuine recorded game footage.

## Repair and contracts

- Remove root yaw and root translation in a Three.js Y-up, right-handed coordinate system before qualifying animated **local** hand travel. Reapply current root yaw to the measured displacement before drawing the retained local ribbon at the genuine current hand position. Do not claim sword-tip tracking.
- Forward the independent **raw browser frame interval** through the opt-in D04 coordinator to the ribbon sampler. Preserve the 50ms one-shot animation timestep. Suppress and clear any retained sword trail on non-finite, zero or >60ms raw intervals, restarting sampling at the new real hand pose after the gap.
- No rig mutation, new mesh, material, draw call, physics, invented attacker, HP estimate, foley recipe, sound asset or new WebAudio voice. Seven instanced effect pools, 102 reserved instances, <=7 live effect draw calls and <=8 voices are unchanged. Old damage proof, presentation receipt barrier, explicit audio opt-in/mute, reduced motion/flash, scene reset and cue dedupe remain intact.

## Reproducible checks / limits

In an isolated Node 22 module scratch, two focused new root-yaw tests were **RED** against the GitHub parent's exact measured-weapon-trail.js and **GREEN** after replacement. A raw-frame forwarding adapter test was **RED** against the earlier detached coordinator implementation and **GREEN** with optional second-argument forwarding; the branch coordinator is patched by the same exact signature and call-site. Four focused CJS tests (rotation, local swing, staleness, coordinator forwarding) subsequently passed in the scratch against the modified standalone components. Repository build, full test suite, test source-integration check and real Playwright/live Dungeon playback remain unverified while the coding/browser tunnel is offline. Do not label this integrated acceptance.

Once a proper worktree/browser is available:

\`\`\`sh
node --test tests/foundation/dungeon-root-motion-frame-d04.test.cjs \
 tests/foundation/dungeon-measured-hand-trail-d04.test.cjs \
 tests/foundation/dungeon-physical-feedback-d04.test.cjs \
 tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs \
 tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
\`\`\`

Record baseline /dungeon and D04 /dungeon?feedback=d04 at identical actual run/floor/tick/checksum, three viewpoints, 1440x900 and 390x844; include turning-only attacks, true local arm swings, misses, confirmed HP loss, block, dodge, arrow, spell, Warden tell/release/recovery/counter and full restart. Capture actual opted-in sound bus; verify the first WebGL submitted frame and PCM onset rather than relying on a separate WAV. Stress 20 minutes, background resume, 200ms+ frame stalls, mute/reload and reduced settings. Label missing footage **UNVERIFIED**.

**Next dominant weakness:** hand motion is still a proxy; no measured GLB sword-tip path or visual/audible alignment to the actual steel edge has been proved. That requires inspecting the real licensed weapon mesh in moving gameplay, with no fabricated offsets or added rig ownership. Rollback: revert this D04-only commit. No edits to authoritative gameplay, main, Draft PR #49, camera, character rigs or other workstreams.
