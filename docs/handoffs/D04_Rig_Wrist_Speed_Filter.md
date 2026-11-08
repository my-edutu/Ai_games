# D04 — suppress slow wrist drift masquerading as a blade streak

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Reviewed parent: `94c4cacedc692aa8e3bc3845f464d662a782909e`. Frozen comparison BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

**Status: detached exact-module red/green validated; authentic 3D gameplay and WebAudio synchronization UNVERIFIED.**

## Defect and test-first reproduction

The measured-wrist policy previously applied only a fixed 25mm displacement minimum and 380mm maximum. It accepted a hand moving 50mm over 60ms (0.83m/s), and would render an identical silver ribbon to one moving 50mm over 16ms (3.13m/s). Slowly repositioning a wrist during a recorded attack should not be presented as a physically energetic blade streak. A detached V8 run of the parent GitHub source reproduced the issue: the new slow-drift test failed while the three control cases passed.

## Narrow D04 change

The existing root translation/yaw compensation, single observed-bone continuity, 25–380mm displacement window, 60ms frame maximum and source-rig requirements are retained. An additional **0.90 metres/second minimum measured local wrist speed** rejects only slow samples. Faster observed strokes continue to draw the same retained ribbon. This is a **wrist-motion heuristic**, NOT confirmed blade-tip geometry, hit detection or contact proof. The speed threshold is a conservative preview candidate requiring footage-based tuning, not a physically calibrated blade measurement.

The production change is isolated to `public/ai-dungeon/measured-weapon-trail.js`. A native Node contract is appended to `tests/foundation/dungeon-measured-hand-trail-d04.test.cjs` for slow-drift rejection, normal-rate/deliberate motion, and root movement invariance. Detached evaluation of the exact patched module satisfied 14/14 scripted checks (including previous rig identity and malformed sample rules). **Native Node suite, build, CI, genuine browser A/V, and 20-minute soak did not run.**

## Resource, authority and rollout

Zero additional GPU resources, geometry, pools, audio voices, buffers, timers or network calls. The same seven retained VFX pools (102 instances), eight-voice original audio engine, opt-in/mute epoch, reduced motion/flash and frame-submission gate remain unchanged. Authority rules, target attribution, map collision and public snapshots are unmodified. Default `/dungeon` remains legacy; D04 remains `?feedback=d04` only.

The source GLB/texture binaries are referenced in the pinned asset manifest but not committed under `public/ai-dungeon/models`. No actual blade-tip geometry or original matching Warden/desktop/390px recordings was available here. Genuine three-viewpoint clips, sword misses/hits, blocks, dodges, projectiles, spells, Warden warning/release/recovery/earned counter, PCM aligned to submitted frames and a 20-minute stability trial remain required.

## Next primary weakness / rollback

Before selecting any further wrist threshold, obtain actual GLBs and motion clips; identify the physically skinned weapon mesh/blade-tip transform. Validate the preview against the frozen BEFORE at 1440×900 and 390×844 from three viewpoints. If real sword gestures are suppressed too often, revert this isolated three-file commit rather than weaken unrelated animation or authority.
