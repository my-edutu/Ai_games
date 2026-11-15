# D04 — Strict own-recipe admission for original combat foley (15 November 2026)

**Scope:** `my-edutu/Ai_games`, isolated branch `feat/dungeon-d04-combat-feedback-realism-20261108` only. Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324`. Normal spectator is unchanged; only `?feedback=d04` activates D04. **Not** a claim of complete audiovisual acceptance or fixed WebGL stalls.

## Source inspection and defect

Inspected `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, current D04 original sound engine, its tests, the previous real Chrome playback logs and prior authentic desktop/390px media limitations.

`original-combat-foley.js` used `RECIPES[cue?.audio]` on a frozen but ordinary JavaScript object. `Object.freeze()` does **not** disable inherited prototype lookup. Unsupported cue names `constructor`, `__proto__`, `toString`, `valueOf`, and `hasOwnProperty` therefore returned non-recipe objects. In the standalone audition path, they entered the WebAudio source-allocation attempt and were miscounted as device failures. Production already rejects most noncanonical cues later, but untrusted recipe lookup must reject before allocating nodes on either path. This is a source-confirmed sound integrity/reliability defect, **not evidence** that it caused any real renderer stall.

## Isolated test-first correction

1. **RED regression** [af8f7e6](https://github.com/my-edutu/Ai_games/commit/af8f7e6a0f45ed1bef89187772ad7b043192c8b1), in `tests/foundation/dungeon-d04-original-foley-cue-identity.test.cjs`. It runs both production strict and standalone audition engines against inherited names, requires zero WebAudio allocation and zero bogus device failures, then verifies a legitimate HP impact still starts. Native [RED workflow 43657051950](https://github.com/my-edutu/Ai_games/actions/runs/43657051950): **353/354 passed, exactly one expected regression failure**; source allocations were **5 instead of 0**.
2. **GREEN correction** [c6532d2](https://github.com/my-edutu/Ai_games/commit/c6532d2f0b048a1142243e6478e119e5e959a3a8) in `public/ai-dungeon/original-combat-foley.js`: require `Object.hasOwn(RECIPES,cue?.audio)` before selecting a recipe or scheduling its WebAudio nodes. No new audio recipes, generated buffers, sounds, material intensity, event identities or clocks.
3. Native [GREEN workflow 43657162415](https://github.com/my-edutu/Ai_games/actions/runs/43657162415): **354/354 D04 selected tests passed**, syntax checks passed, **production build passed**. Real Chrome/Three.js D04 job was queued at the time of this handoff; no green browser acceptance is claimed.

## Specification and experience review

This is an **admission-only** change. Original mono noise remains a single 13,440-sample generated texture within the 19,200 cap. Eight live foley voices, seven retained GPU pools, 32 pending/32 awaiting-frame/64 receipts, event dedupe, cleanup, browser gesture consent, mute persistence, reduced motion/flash, scene revocation, and unchanged <=400ms sound deadline remain as before. No gameplay, `games/ai-dungeon/src`, character rigs, camera, global lighting, default route, main, Draft PR #49, or other session branch was changed. The accepted-cue recipe path is unchanged and is covered by the same regression.

**Realism limitation:** Existing actual Chrome/Three.js 1440×900 and 390×844 diagnostic recordings show multi-second frame submission/encoder delivery gaps and `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`, including legacy comparisons. Prior genuine media do not establish 3 matched moving viewpoints, independently decoded/sample-aligned original WebAudio contact, complete Warden warning/release/recovery/earned counter, miss/block/dodge/arrow/spell versus HP impact, or 20-minute cleanup. Do not count source tests or standalone auditions as audiovisual proof.

**Next dominant weakness:** isolate real WebGL renderer/capture stalls under matched authoritative states with actual contact and sample witnesses; provide the owning renderer session with evidence. Do not extend 400ms or fabricate late sound or impact.

**Rollback:** revert only [c6532d2](https://github.com/my-edutu/Ai_games/commit/c6532d2f0b048a1142243e6478e119e5e959a3a8) if a supported original recipe is unexpectedly affected; retain the regression contract and isolated branch for review.
