# D04 — Live first-frame Warden hazard after real WebGL stall (12 Nov 2026)

**Status: ISOLATED IMPLEMENTATION / REALISM NOT ACCEPTED / DO NOT MERGE.**

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
Prior branch head: `bb890482c10410391b19e3c5272519ebc863db42`.
Frozen BEFORE comparator: `281735d0910c6b2443648af976003d50412ee324`.
Legacy `/dungeon` remains default; only explicit `?feedback=d04` enables D04.
No authority, characters, camera, lighting, main, Draft PR #49 or other branch was modified.

## The observable defect and its narrow correction

Authentic browser acceptance in [43134170587](https://github.com/my-edutu/Ai_games/actions/runs/43134170587) produced **30 genuine renderer acknowledgements, 26 queued cues, 26 expirations, zero visual admissions and zero original combat audio admissions** while showing a real HP decrease. Earlier authentic sequences measured >900ms and >3-second software-WebGL stalls. The latest failure is not evidence that every cue was a Warden warning; it establishes the broader late-presentation problem.

D04 had previously fixed **already-drawn** Warden danger markers disappearing after a long WebGL frame. A separate hole remained: a **new** authentic warning queued immediately before the first slow frame expired in `popDue()` at 400ms *before ever reaching the retained warning stage*, even while the latest public authority still proved the exact warning footprint, future impact tick, shape and sole living Warden.

This increment permits **visual-only** first-frame admission of that still-authoritative warning after a verified slow frame. It explicitly does **not** recover stale Warden warning sound. It reuses the existing retained visual stage and its full-footprint `isLiveWardenWarning()` check. Missing or invalid frame intervals, cancelled/replaced warnings, changed footprints, dead/ambiguous owners and other cues fail closed. A new legitimate tick-12 warning is distinguishable from a revoked tick-11 warning.

The physical first-frame hazard may now be visible when authority still reports danger; this is a **source-level correction, not yet observed in new real-browser moving footage**. An already expired hit, projectile, gesture, block or sound is never recovered by this exception.

## Test-first verification

- `tests/foundation/dungeon-d04-live-queued-warning-stall.test.cjs`: four isolated contracts for a valid live Warden marker after an 800ms GPU stall, changed/retired/missing ownership and footprint, invalid timing, and non-revival of stale true HP-loss impacts.
- A further counter-invariant assertion prevents an admitted live marker from also being counted as an expired cue.
- `.github/workflows/dungeon-d04-foley-identity.yml`: runs this specific new contract in the existing isolated native suite.
- `public/ai-dungeon/physical-combat-feedback.js`: one visual-only branch at actual pending expiry, `lateLiveWarningVisuals` counter and receipts with explicit `live-warning-visual-only-after-stall` decision. Accepted visuals and expired cues remain disjoint; pending limit 32, receipts 64, seven GPU pools/104 instances and 400ms stale-audio deadline remain unchanged.

Test-first CI [43139756166](https://github.com/my-edutu/Ai_games/actions/runs/43139756166) failed **three expected assertions** with the new contracts and old source. Initial implementation [43139873899](https://github.com/my-edutu/Ai_games/actions/runs/43139873899) passed 148 native contracts but failed one mistaken test assumption: a legitimate **new** tick-12 footprint may paint after the old tick-11 warning is revoked. The corrected test checks that the *old* warning is not revived rather than denying new authentic danger.

The controller counter was then corrected to preserve the existing browser classifier invariant `visualAccepted + expiredQueuedCues <= queued`. No counter is incremented twice for the same successfully revived warning. Stale audio is counted only when the original consent epoch was eligible.

The corrected candidate [43140193368](https://github.com/my-edutu/Ai_games/actions/runs/43140193368) has **149/149 native tests green** and the native/build job successful. The genuine Chrome/Three.js job was still in progress when this handoff was authored. No claim of a new real-browser pass or changed audiovisual look follows from native contracts.

## Separate visual and sound evidence

Independently inspected earlier genuine Dungeon readback WebM has **9 actual VP8 picture packets** at 0.836–4.392s plus original soundstage Opus; its changing pixels prove sparse real gameplay, not smooth animation, precise blade geometry or impact audio onset. The inspected recording is **from before this source change**. Existing 1440x900 and 390x844 compositor stills do not constitute matched moving, three-camera audiovisual clips. No authored audio, synthetic gameplay damage or false source has been substituted.

A recovered live first-frame warning has **no original sound receipt** and no frame ID in its admission receipt, precisely to prevent conflating a requested retained marker with actual delivery or encoded media. The next actual WebGL submission must still independently prove pixels on screen. The browser acceptance classifier currently measures aggregate visual admissions; it does not separately certify a particular HP-hit fragment, so a warning-only visual admission must not be advertised as proof of a synchronized physical impact.

## Two review passes and rollback

**Spec review:** live warning identity is anchored to public `bossWarning`, owner, future attack tick, full authoritative cells and scene. Non-warning one-shots remain governed by original 400ms deadline. No attacker is inferred. Audio opt-in/mute, reduced motion/flash, deduplication and scene flush are untouched.

**Quality review:** at most one additional bounded `isLiveWardenWarning()` check per expired warning cue (pending queue max 32), plus existing retained pool emission. No timers, worker, extra 3D materials, draw calls or WebAudio voices are created. This does not address underlying SwiftShader frame starvation. The allowance must be judged against clutter and true visible hazard in moving footage.

**Rollback:** revert the D04 controller changes, focused tests and isolated workflow registration on this branch only. No merge to main or PR #49.

## Next dominant weakness

Verify in *authentic* browser playback that a warning still alive at the first post-stall submission is actually visible, while revoked danger and late sound are not. Then tackle the actual HP-impact/no-admission bottleneck, sparse encoded frame delivery and calibrated PCM contact onset. Still outstanding: three matched camera views, desktop/390px moving evidence, full Warden warning→release→recovery→earned counter, real missed swing, block, dodge, projectile and spell, authenticated blade-tip geometry and 20-minute cleanup soak. **None is accepted by this native test pass.**
