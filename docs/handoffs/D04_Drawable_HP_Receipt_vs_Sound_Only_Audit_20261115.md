# D04 — Drawable HP receipt versus sound-only impact audit (15 November 2026)

**Status:** independently reviewable diagnostic integrity correction; **not** genuine-clip acceptance, audio/video synchronization, or a claim that WebGL stalls were fixed.

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`. Legacy spectator stays default. New D04 remains opt-in `?feedback=d04`.

## Observed defect and bounds

Genuine browser playback at the previous branch head (workflow [43646622488](https://github.com/my-edutu/Ai_games/actions/runs/43646622488)) completed five diagnostic Playwright scenarios but failed the strict authentic-impact trial with `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. D04 slow-frame evidence included a desktop 2,818ms advance-to-submission interval (2,814ms measured renderer, 0ms D04 retained/effect phases) and a mobile 1,903ms interval (1,901ms renderer, 0ms D04 phases). Legacy playback also showed severe stalls. These are *sampled* phase receipts, not proofs of GPU completion, a single culprit, or an audiovisual score.

Existing earlier opt-in original-sound WebM evidence was independently inspected in this run: desktop clip has 8 decoded VP8 frames, encoded 587×339; mobile has 10 decoded VP8 frames, encoded 390×523. The inter-frame PTS gaps include approximately 5.132s desktop and 4.528s mobile. These are **recording timestamp gaps** only, not measurements of impact-to-sample delay or proof of D04 causation. Still images are not moving three-angle comparison.

The matched continuous-mode diagnostic had a separate logical false-positive: `hasStrictInjuryReceipt` called a `visual:true` plus `decision:'delivered'` receipt a timely HP **visual** even if `visualDrawableAtSubmission` was false or missing. The production controller deliberately allows *verified HP sound* with occluded retained shards, so this diagnostic could claim visible combat impact from sound-only original foley. The strict real-render acceptance classifier already distinguished that case correctly.

## Scoped correction

- `tests/foundation/dungeon-d04-continuous-mode-pair.test.cjs`: add contract for occluded, unknown and absent drawable evidence, invalid silent `delivered`, actual timely drawable `delivered` and genuine muted `visual-only-submitted`.
- `tests/browser/dungeon-d04-continuous-mode-pair.cjs`: count a timely visual only on affirmative `visualDrawableAtSubmission===true` plus a consistent submitted decision: `delivered+audio:true` or `visual-only-submitted+audio:false`. Leave all other genuine frame-clock, scene, actor, HP victim and <=400ms gates intact.

This changes **diagnostic classification only**. No new VFX, nodes, acoustic timbres, resources, source action, contact fiction, deadlines, renderer settings, authority, gameplay, rig, camera, light, or default flag. Nothing here repairs a multi-second WebGL render submission.

## Test-first and evidence honesty

1. Test contract commit [f409cb8](https://github.com/my-edutu/Ai_games/commit/f409cb8d4b9f15923fab6b62c780c48da8d43bc1).
2. Correction commit [bd20899](https://github.com/my-edutu/Ai_games/commit/bd208991f2528606e1a340c820792e7ad1403192).
3. A sandboxed in-memory **source execution**, using the fetched exact GitHub classifier from both commits, reproduced the RED logic: occluded, missing, unknown and falsified silent deliveries each counted as timely 1; muted real drawable counted 0. The corrected source produced [0,0,0,0,1,1] in that same six-case order. The complete 17-case foundation classifier test file also passed 17/17 using an isolated lightweight JS test harness. **This is not a native Node test execution or a CI claim.**
4. The relevant GitHub Actions workflow watches both changed paths; new native contract/build and fresh Chrome playback outcomes were not independently retrievable at this handoff. The last confirmed completed native suite is the preceding head's **352 passing tests plus build**, not this commit's verification.

## Mandatory acceptance still open

Need actual complete original Dungeon runtime and Three.js WebGL proof: 3 matching camera directions in moving footage at 1440×900 and 390×844; Warden warning/release/recovery/earned counter; explicit sword miss versus real HP loss; block, dodge, arrow, spell, interrupt; original opt-in PCM matched to actual submitted/decoded impact; consent/mute/reload, accessibility, WebGL-loss recovery and 20-minute soak. Keep all unverified until measured.

**Next dominant blocker:** paired legacy/D04 software-renderer stalls, not the new evidence classifier. Prioritize browser on-device frame/encoder timestamps and submission-phase sampling, then pass renderer-specific cost to its owning session; do not extend 400ms, backfill ghost impacts or edit protected renderer code.
