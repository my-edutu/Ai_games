# D04 — Canonical aimed-sword whoosh and HP causality (14 November 2026)

**Status:** isolated source/test correction complete; real-game sound delivery **NOT AUDIOVISUALLY VERIFIED**. Full physical realism **NOT ACCEPTED**.

## Ownership, baseline and diagnosis

- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`; starting verified head `a2231465c5300eb57d3e07d5ceb656be9cc5fefc`. Frozen BEFORE comparator: `281735d0910c6b2443648af976003d50412ee324` (that frozen version has no D04 original foley module).
- Read `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, D04 physical planner, current original procedural foley, relevant foundation tests, actual preceding Chrome run logs, and the game-audio, game-feel-vfx and performance-optimization skill guides.
- Only the D04 original foley source and a D04 native foundation test changed. No writes to main, PR #49, `games/ai-dungeon/src`, rigs, camera, global lighting or another session branch.

The planner correctly observes a **new real public sword action** and may report its uniquely verified **aim** in `targetId`. Its canonical immutable cue ID is `scene:tick:swing:actor:aim`, for example `1:1:8:swing:vanguard:revenant`. An aimed sword is a **swing attempt**; even an authentic resolved aim does **not** prove a weapon hit or HP loss.

Before this fix, `isCanonicalVerifiedCombatFoleyCue` calculated the strict swing sound identity using `target='-'` for **every** swing, not just the unmatched ones. As a result, valid aimed swings could produce measured visual blade motion yet be refused original WebAudio foley in the strict production preview. Unmatched/missed swings with null target passed; this asymmetry undermined the main combat sound.

## Test-first change and preservation

1. Native regression constructs genuine adjacent-tick public snapshots for Vanguard versus Revenant, with a unique legal aim, and gets a **real planner cue** (not a fabricated cue for the positive test). It requires canonical aimed ID acceptance, exactly one original whoosh, zero HP injury onsets, duplicate rejection, and fail-closed rejection when aim identity changes or has an invalid type.
2. Confirmed RED: [run 43574465979](https://github.com/my-edutu/Ai_games/actions/runs/43574465979) — 329 pass, **one intended failed assertion**: `authentic targeted attempt must pass strict sound identity`; browser not run because native contracts failed. Regression commit: [21c9a71](https://github.com/my-edutu/Ai_games/commit/21c9a7175971088ee93f65a447f4551e5577d09a).
3. Correction: [eeecdec](https://github.com/my-edutu/Ai_games/commit/eeecdecf0fc12f94a6cba67abeda60bc2c071b99) — canonical sound witness now reproduces the swing's optional aimed target while validating its string shape. The prior no-target `'-'` behavior, anonymous HP-only injury source, and release action-only identity remain unchanged.
4. Confirmed native GREEN: [run 43574567089](https://github.com/my-edutu/Ai_games/actions/runs/43574567089) — **330/330** native tests, 0 failed, JavaScript checks and `npm run build` passed. Its real Chrome preview job was running at this handoff; **do not assume browser acceptance**.

The change introduces no sound, texture, scene, listener, pool, or buffer allocations beyond a bounded canonical cue check. Audio still requires a real opt-in gesture, running WebAudio context, actual submitted drawable blade with valid pose and frame receipt, current consent epoch, dedupe, bounded voices and no elapsed >400ms. The aim field authorizes **only the whoosh**, never a successful-hit sound, invented attacker, target injury, VFX fragment or simulation change.

## Authentic evidence versus source/native evidence

The latest *completed pre-change* genuine Dungeon Chrome smoke [run 43569513403](https://github.com/my-edutu/Ai_games/actions/runs/43569513403) passed five browser diagnostics and failed the separate strict visual gate `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Its desktop/mobile renderer-phase evidence shows multi-second stalls that also occur in legacy mode; causation by D04 is unproven. It did not independently demonstrate an aimed swing sound missing in decoded actual-game PCM. Today's new regression and fix are source/native evidence, **not** sample-synchronized audiovisual proof.

The running post-fix Chrome job may collect fresh true WebGL/opted-in WebAudio tracks. Do not claim a passed A/V test unless the completed verdict and separately decoded moving frames plus audio-contact synchronization support it. Genuine three-view desktop and 390px mobile matching, Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell/impact, mute/reload, reduced motion/flash, and 20-minute resource soak remain outstanding.

## Reviews, rollback and next weakness

**Spec check:** real aim does not equal real contact; no HP-only attacker attribution, and strict canonical proof is still required. **Quality check:** minimal read-only validation on a single original foley hot path, with positive real-planner action, malformed target negatives, deduplication and zero damage onsets covered.

**Rollback:** revert source commit `eeecdec` only on the isolated D04 branch if a final integrator discovers mismatched real-game identity constraints; keep the failing regression as a stop-ship signal. Do not merge or deploy. Legacy spectator remains the default, and only `?feedback=d04` enters this experimental channel.

**Next dominant observable blocker:** multi-second WebGL submission stalls that expire legitimate HP visuals before a drawable real frame. Use completed matched legacy-versus-D04 phase receipts and real clips to separate renderer stalls from D04 admission cost. Preserve the 400ms fail-closed sound deadline and do not edit the protected renderer, authoritative gameplay, rig or camera. 
