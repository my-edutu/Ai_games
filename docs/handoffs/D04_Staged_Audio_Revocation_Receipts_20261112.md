# D04 — Explicit revocation receipts for unsubmitted impact sound

Date: 2026-11-12
Status: **IN PROGRESS / NOT COMBAT-REALISM ACCEPTED / NOT A/V VERIFIED**
Only branch: \`feat/dungeon-d04-combat-feedback-realism-20261108\`
Frozen BEFORE reference: \`281735d0910c6b2443648af976003d50412ee324\`
Increment base: \`69e17eba71921b30a2d411454f45a9346b0c200f\`

## Actual observation, not a claimed new capture

The completed previous genuine Chrome/Three.js run [43234194418](https://github.com/my-edutu/Ai_games/actions/runs/43234194418) passed five of six browser trials but correctly rejected the original witnessed HP loss as \`AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED\`. Actual continuous playback still contains multi-second software-WebGL calls. The earlier original desktop WebM \`d04-original-capture-desktop-unaligned.webm\` was independently decoded with local FFprobe: only eight video frames (PTS 0.065, 0.656, 1.256, 1.864, 2.647, 3.348, 9.055, 9.080 seconds) and a 5.707-second gap. These are **older** media, not fresh evidence for this change; no sample-synchronized audio conclusion is available. Original legacy presentation at the frozen BEFORE point is in \`public/ai-dungeon/app.js\`; D04's new controller did not exist in the frozen spectator baseline.

## Concrete D04-only defect

While a confirmed real HP-loss cue waits for an actual submitted WebGL frame, a browser audio-context suspension, explicit mute, or soundstage rebinding used to clear \`awaitingPresentation\` without **any per-cue receipt**. Thus an independently verified wound could vanish from the feedback evidence trail even though no impact sound played. Aggregates did not say which injury was revoked or why. This is especially important when render stalls are already causing original HP-loss cues to expire. Do not mistake this for resolving the slow rendering itself.

## Changes, bounded by existing contracts

- Add \`revokeAwaitingAudio(decision)\` inside the D04-only physical-feedback controller. It emits one bounded receipt for every staged cue before discarding the staged sound. Receipts preserve cue ID, source tick, authentic victim/damage provenance, prior visual-admission boolean, \`audio:false\`, \`frameId:null\` and \`sampleSynchronized:false\`.
- Distinguish \`audio-context-interrupted\`, \`muted-before-submission\`, \`audio-adapter-rebind-refused\` and \`audio-output-rebound\`. Never invent frame submission or audio onset on these paths.
- Keep the 32 staged-audio cap and the existing 64-receipt ring. No new mesh, shader, audio voice, buffer, timer, unbounded map, altered simulation or new opt-in pathway.
- Preserve the audio opt-in epoch rules, manual mute storage, no auto-play after reload, reduced motion/flash, authoritative damage truth, and the original 400ms expiry.

## Test-first record and verification requirements

- Test-first commit: [be8dcc2](https://github.com/my-edutu/Ai_games/commit/be8dcc2fc4c315232f86d332c470fc0200b48209). Two initial Node regressions check genuine-by-fixture consecutive HP loss queued *before* WebGL, followed by (1) explicit AudioContext suspension and recovery and (2) manual mute and explicit re-opt-in. Follow-up [592cf82](https://github.com/my-edutu/Ai_games/commit/592cf82b8f4cbb14d3c629e006653c1a12e76af0) exercises a refused injected-adapter context rebind and proves that its original injury never acquires a frame or sound. They require per-cue refusal receipts, no fabricated frame acknowledgement, no old sound resurrection, and new post-resume/newly opted-in contact still eligible.
- Controller correction: [5bb11f2](https://github.com/my-edutu/Ai_games/commit/5bb11f21dd8d9aad280e155b0fc0ce745dafd745).
- **Red-run execution not verified**; the failing behavior was source-inspected and the tests were committed before correction. **Green native/production build and fresh Chrome have not yet been retrieved** for this candidate. Do not claim either passed until actual results are inspected.
- Required checks: \`node --test tests/foundation/dungeon-d04-snapshot-arrival-clock.test.cjs\`, complete D04 CI native contracts, \`npm run build\`, genuine Chrome at both 1440×900 and 390×844, representative HP impact / miss / block / dodge / projectile / spell and three-viewpoint Warden warning-to-counter.
- The branch's existing \`.github/workflows/dungeon-d04-foley-identity.yml\` includes this test, authentic Chrome tests, and artifacts on matching D04-path pushes. Keep any strict browser acceptance failure red rather than weakening its gate.

## Specification and quality review

**Safety:** No action cue certifies damage. Only consecutive authoritative HP decreases may yield injury effects. No sound is emitted on revoked staged cues. Context suspension does not silently persist a manual mute, and re-opt-in still requires a fresh gesture where manually muted. Rebind cannot replay the old FX bus.

**Bounded overhead:** At most 32 staged records can be converted on one revocation; each has O(1) bounded receipt work against an existing ring of 64. This occurs on rare mute/context lifecycle paths, not normal per-frame WebGL. It increases \`staleAudioDropped\` by the number explicitly revoked instead of hiding those losses.

**Regression considerations:** Receipt histories now include terminal lifecycle decisions that were previously absent; any consumer expecting an empty receipt array after mute should distinguish absence of sound from absence of evidence. No renderer/camera/rig changes. Original procedural foley remains licensed-independent.

**Rollout and rollback:** Only the existing \`?feedback=d04\` preview is affected. Legacy \`/dungeon\` remains default. Revert controller correction \`5bb11f2\` if an incompatible consumer or safety regression is observed; keep test-first evidence available for audit. Never merge main or Draft PR #49 as part of this increment.

## Next real acceptance blocker

Genuine moving combat still fails timely witnessed HP-loss visual delivery under intermittent multi-second WebGL submissions. Next: correlate unpaired consecutive live ticks, effect density and strict per-injury receipt timing; make an optimization ONLY when evidence identifies a D04-owned renderer cost. Full matched three-viewpoint original A/V, mobile playback, missed swing / block / dodge / spell / projectile / Warden warning–release–recovery–counter, sample-decoded audio synchronization and 20-minute soak remain unaccepted.
