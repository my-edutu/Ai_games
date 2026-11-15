# D04 — Defensive visual/audio canonical receipt identity

Status: **isolated implementation; native GREEN and new-head genuine Chrome UNVERIFIED**.
Branch: \`feat/dungeon-d04-combat-feedback-realism-20261108\`.
Starting inspected head: \`9288239ef4950f6f0d9b7cdc41e047572f1a898a\`.
Frozen BEFORE is pinned at \`281735d0910c6b2443648af976003d50412ee324\` in \`D04_Real_3D_Preview_Acceptance.md\`; it is **not** a validated visual comparison here.

## Defect and scope

The D04 original-f​​oley admission contract already verifies exact canonical event identities for observed blocks and one-cell evades. However, the visual stage revalidated the defender/evader pose and public snapshot **without** requiring that same canonical identity. A copied \`verified\` flag, expected action and legal map step could therefore allocate a shield contact or dust chip with an event ID claiming a different defender, or with a made-up victim/impact sound label that foley would reject.

No actual mistaken block/dodge in real WebM footage has been established. This is an observable source-contract divergence and a possible false visual attribution, not a proof of any observed gameplay collision.

## Test-first changes

1. \`tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs\`: new strict production-stage fixture checks that mismatched defender/evader IDs, invented pursued targets and contradictory impact-audio labels do not allocate GPU art; checks canonical, same-tick block and dodge remain drawable. It also bounds reserved instances and draw calls.
2. \`public/ai-dungeon/physical-feedback-visuals.js\`: strict \`requireVerifiedHpReceipt\` stage now applies the *existing* \`isCanonicalVerifiedCombatFoleyCue\` receipt gate consistently to projectile, spell, block and dodge visuals. No new parser, proof type, attacker inference, audio buffer, node or GPU pool.
3. Standalone geometry auditions intentionally retain their earlier permissive fixture-ID contract; the real D04 controller remains the strict source of runtime evidence.

Expected test-first RED: mismatch block/dodge would be admitted before the visual code correction. **RED execution was not observed**: the coding tunnel was disconnected, so do not cite a failing CI run. Native GREEN, production build and corrected-head Chrome need explicit post-commit evidence before passing.

## What remains invariant

- No edits to main, Draft PR #49, \`games/ai-dungeon/src\`, rigs, animations, camera, lighting or another session.
- HP-only loss remains independent from any named attacker; a missed swing cannot become injury. Ranged launches remain action evidence, not hits.
- Seven existing retained pools, 102 reserved visual instances, maximum seven D04 effect draw calls and the existing eight-voice foley cap.
- Original WebAudio remains fresh-click opt-in with mute persistence; reduced-flash and reduced-motion behavior unchanged; event receipt deduplication, scene cleanup and 400ms frame submission deadline unchanged.
- \`/dungeon\` stays legacy-default; only \`/dungeon?feedback=d04\` exercises experimental D04.

## Genuine evidence and next acceptance gate

The preceding genuine Chrome workflow (run \`43752105749\`, 2026-11-15) completed its six frame-acknowledged camera/viewport recordings, including 390×844, but its strict preview test **failed \`AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED\`**. Browser decoding reported zero independently verified decoded frames, and contact-to-PCM alignment was **UNVERIFIED**. These recordings predate the present correction and cannot validate it.

The principal observed realism weakness is still missing universally drawable genuine HP injury under intermittent multi-second renderer submission stalls, not the renamed-ID defect corrected here. The next dedicated integration pass must obtain independently decoded, motion-qualified original capture and PCM from all three viewpoints on desktop/mobile; measure renderer and D04 phase costs without conflating them; confirm 400ms receipt deadlines and a 20-minute cleanup soak; then exercise miss, block, dodge, arrow, spell, actual HP injury, Warden warning/release/recovery/counter and restart. Do not relax deadline or infer attackers to force a pass.

Rollback: revert only the two D04 commits for this increment. No main-branch changes or rollout.
