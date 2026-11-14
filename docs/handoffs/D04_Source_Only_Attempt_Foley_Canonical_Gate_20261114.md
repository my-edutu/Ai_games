# D04 — Canonical source-only combat foley, guard and support (14 November 2026)

**Status: isolated code GREEN (343/343); real audiovisual acceptance NOT ACHIEVED.**

## Boundaries and source inspection

- Repository: `my-edutu/Ai_games`, branch `feat/dungeon-d04-combat-feedback-realism-20261108`. Starting head of this increment: `31204fcbef51e8529cb056c33526adb9e04f43b0`.
- Read `AGENTS.md`, D04 real-preview acceptance gate, the actual `physical-feedback-plan.js` and `original-combat-foley.js`, and the game-audio, game-feel-vfx, performance, and simulation-QA skills.
- Inspected frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`: `public/ai-dungeon/app.js` exists there, but the D04 original-fidelity `original-combat-foley.js` did not. This is not a new BEFORE/AFTER comparison or real-playback quality score.
- No edits to `main`, Draft PR #49, `games/ai-dungeon/src/**`, character models/rigs, camera, global lighting or other sessions.

## Real defect and fix

In strict production mode, named `draw`, `cast-dry`, `guard` and `utility` audio recipes were not subject to the canonical D04 event gate. A bare named recipe could schedule source-only action audio. In particular the planner deliberately marks `ranged-unmatched` and `cast-unmatched` as **unverified contacts** because it lacks a legal target; the sound engine allowed a repeat of the same action once cooldown elapsed because their `verified:false` cues were not retained in confirmed-event history. No evidence of successful spell/projectile contact or HP loss may be inferred from this sound.

The revised strict foley gate admits **only the exact public planner shapes** for `guard` (`utility` visual + `guard` audio), `cast-utility` (`utility` visual/audio), `ranged-unmatched` (`none` visual + `draw` audio) and `cast-unmatched` (`none` visual + `cast-dry` audio). Each must match its unique real source ID, source cell, scene/run/floor, tick, canonical immutable event ID, null target and null arrival. Guard/utility must be verified; unmatched attempts must remain unverified and are never relabeled as hits.

All four now enter the same bounded one-shot ID ring and five-tick history horizon after **successful** WebAudio scheduling. Invalid requests allocate no sources and cannot consume active voices or history. The start receipt distinguishes canonical verified cues from explicitly **observed but unconfirmed attempts**, keeping `sampleSynchronized:false`. Non-strict standalone procedural sound auditions remain permissive but are **not** real-game evidence.

## Commits, test-first proof, CI

1. Test first: [`44a1597`](https://github.com/my-edutu/Ai_games/commit/44a1597815471bef7913cc3122e24bda9023a132), with real planner-positive guard, healer, unmatched arrow and unmatched spell actions, forged recipe rejection, idempotency and historical replay prevention.
2. Confirmed RED: [workflow 43613668674](https://github.com/my-edutu/Ai_games/actions/runs/43613668674), 340 passing / 3 expected failing native tests, browser skipped.
3. Source fix: [`cb83fed`](https://github.com/my-edutu/Ai_games/commit/cb83fed9f54d84f14b88e8f11b4629608fe70a29); intermediate CI [43613797861](https://github.com/my-edutu/Ai_games/actions/runs/43613797861) passed the three new contracts but exposed two prior eight-voice fixture failures which used invalid raw recipe names.
4. Repair preemption fixtures without weakening production sound admission: [`6704e5b`](https://github.com/my-edutu/Ai_games/commit/6704e5b22b882bd173324d66332d1b4957fa3d43). The existing 8-voice priority-preemption test now fills its mix with canonical source-only action witnesses. Final [workflow 43613908337](https://github.com/my-edutu/Ai_games/actions/runs/43613908337) contracts job **passed all 343/343 native tests**, no failures; production build **passed**.
5. At last check the same workflow's genuine Chrome `real-preview` job was in progress. Its final browser acceptance and decoded synchronized source tracks are **unverified** until reviewed.

## Previously genuine gameplay evidence and major blocker

Inspected genuine prior desktop and 390px mobile frame contact sheets. They show sparse high-angle Dungeon gameplay frames, not three matched moving camera viewpoints or readable exact blade-to-body contact. [Prior real-preview job 43608831976](https://github.com/my-edutu/Ai_games/actions/runs/43608831976) completed five real-browser diagnostics yet failed strict acceptance `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. It preserved a [40MB artifact](https://github.com/my-edutu/Ai_games/actions/runs/43608831976) with one original canvas+audio capture, but decoded PCM and aligned three-viewpoint moving evidence remain unverified. Its genuine continuous renderer-phase receipt recorded 4,722ms desktop and 4,422ms mobile worst sampled intervals in one matched legacy-vs-preview experiment, with similarly large gaps also appearing in legacy; **D04 causation is not established**.

This increment is supported by source and native tests; it has not demonstrated improved perceptual realism, independently audible PCM alignment, or a solved renderer stall. The 400ms submission deadline must **not** be relaxed to conceal stale visuals.

## Safety, resources, rollout and next review

No new third-party audio, samples, buffers, media, timers, geometry, effects or listeners. Original seeded 13,440-sample mono noise texture, <=8 active voices, 128 confirmed IDs, 32 recorded starts, retained seven VFX pools, 32 pending / 32 awaiting-frame / 64 receipts, deduplication, scene/restart/mute cleanup, WebAudio fresh-gesture opt-in, persisted manual mute, reduced-motion/flash presentation and the 400ms frame deadline remain intact. The legacy spectator remains default; D04 is enabled **only** with `?feedback=d04`. Do not merge.

**Specification review:** observed action-only releases retain their intended non-contact semantics. **Quality review:** canonical sound-source gating is materially stronger; true browser PCM onset, visual sync, and perceived physicality still fail acceptance or remain unverified.

**Next highest-value work:** gather frame-phase and decoded-video/PCM evidence through a real Dungeon same run/floor/tick/checksum sequence, three viewpoints, desktop and 390px mobile. Include missed sword, genuine HP impact, guard, dodge, ranged/cultist action, and the full Warden warning/release/recovery/earned counter/defeat/restart, plus audio opt-in/mute/reload, accessibility and 20-minute cleanup soak. If multi-second legacy-renderer stalls persist, attribute the renderer phase with owner sessions rather than modifying camera/lighting/authoritative code inside D04.
