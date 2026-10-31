# Infinite Tower Climb — Gauntlet 35: strike effect follows real fist

**Branch:** codex/infinite-tower-climb-3d-gauntlet · **Pre-edit head:** 6164425b8eaaf57f808c427b81da7554b7f2f1ba · **Review:** SELF-REVIEW only (independent critic/Ultracode tunnel unavailable).

## Evidence and chosen defect

Inspected real G34 desktop and portrait GPU combat PNGs from [Tower Combat CI 41244342713](https://github.com/my-edutu/Ai_games/actions/runs/41244342713), plus a 55.36-second gameplay WebM. A large light-blue semicircle visibly floats beside the climber during a punch because the existing 1.55-unit torus was positioned 1.6 units ahead of the actor root rather than at the moving fist. This undercuts the official ASTRO BOT Rising Heat visible-action comparison. The recorded movie is not sustained FPS evidence.

## One implementation

The unchanged authoritative attack/health flag now reveals a compact 0.56-unit partial torus at the **real rig's right-elbow bone**, transformed from the exact authored local wrist point (0,-.39,.015) after climber animation. This is a skinned-wrist anchor, not invented hit detection. The effect is depth tested, preserves the existing one-draw-call budget, and hides itself when the bone is absent. No physics, collisions, seeded AI, gameplay, replay, camera, HUD or combat event logic changes.

Tests in tests/phase3/tower-strike-fist-cue.test.cjs load the actual cast, verify Three bone/world transforms in multiple poses, missing-joint behavior, unchanged root authority and removal of the detached arc. **New-source CI and GPU screenshot verdict remain PENDING at commit**, not passed by inspection.

## Review and open quality gates

Self-review: root ownership is preserved; the effect follows visible action without adding false hit events. A billboard at the wrist is still not full-body attacking realism or impact physics. The small cue may be less legible at desktop scale, requiring actual GPU and normal-speed motion comparison. The five exact-parent Tower evidence workflows succeeded; broad parent catalogue CI 41244346164 was CANCELLED, not passed. No independent reviewer was available.

Next priority: inspect the exact G35 desktop/portrait combat screenshots and real recorded motion, then develop hand/foot ledge-contact IK, richer Jusant-scale environments and complete character animation. Independent Jusant/ASTRO BOT visual preference, intended-device sustained FPS, accessibility and long-running stability remain OPEN. **Overall GAUNTLET 90 NOT ACHIEVED.** Draft PR #58, no merge/force-push/deploy.
