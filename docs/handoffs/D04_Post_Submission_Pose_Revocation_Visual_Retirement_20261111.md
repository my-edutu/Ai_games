# D04 — Retire post-submission pose-revoked gestures (11 November 2026)

**Status: IN PROGRESS; no matched combat audiovisual acceptance, no final integration.**
Exclusive branch `feat/dungeon-d04-combat-feedback-realism-20261108`, starting head `6eb56045cb8aaa3bccdd9267b5161772943ad604`. Frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`.

## Dominant observable integrity defect
A slow or re-ordered WebGL update may leave the prior retained sword ribbon or body-local cue in GPU slots even when the true animated wrist/actor pose is rejected at the *actual* subsequent frame acknowledgement. D04 correctly refuses to play foley, returning `revoked-drawn-swing-pose` or `revoked-drawn-body-pose`, but previously left the rejected art alive, risking a ghost visual in later frames. This is not a new impact, contact or damage inference; it is strict presentation cleanup.

## Test-first contracts and implementation
1. A D04 foundation contract stages an actual public attack and guard, rejects the final real-frame pose, and requires retirement of precisely those retained cue IDs and no original sound. Independently observed same-victim HP loss is the positive control: it must still be admitted without identifying the attacker. The initial independent [red CI](https://github.com/my-edutu/Ai_games/actions/runs/43108834846) recorded 118/121 passes: attack and guard retained erroneous art, and an initial damage fixture inadvertently changed the victim species. The latter fixture was corrected to preserve actor identity and decrease real HP rather than fabricate damage.
2. `public/ai-dungeon/physical-feedback-visuals.js`: the existing bounded `retireStaleCue` now accepts two explicit pose-revocation decisions, only for their own matching gesture categories and exact cue ID. It cannot retire independent HP injury or live Warden danger-cell warnings by this reason.
3. `public/ai-dungeon/physical-combat-feedback.js`: after genuine renderer-submission pose revalidation fails, the controller requests this retained-slot retirement before preserving the rejected foley receipt. Audio remains silent. Past submitted pixels cannot be retroactively erased; this prevents re-display on a later frame.
4. The existing authentic-bone integration harness `tests/foundation/dungeon-d04-swing-rig-receipt-continuity.test.cjs` now inspects drawable state **after** the renderer receipt: swapped/drifting wrist retires its ribbon; a measured stable wrist keeps its drawable stroke and earns one original whoosh. The independent D04 workflow includes both new and augmented regression suites.

## Specification and quality review
No changes to authoritative `games/ai-dungeon/src`, gameplay seeds, character rigs, animation, camera, lighting, sound synthesis or soundstage buses. Presentation and test files only. Legacy `/dungeon` remains the default; experimental feedback remains restricted to `?feedback=d04`. Never infer an attacker from a health drop; a swing is not a hit. The original 400ms sound staleness gate, WebAudio fresh-gesture opt-in, mute/reload, accessible reduced-motion/flash variants, 7 retained visual pools, <=104 instances, <=7 new draw calls, <=8 active foley voices, <=19,200 original mono noise samples, 32 pending/awaiting and 64 receipt limits are preserved. No extra GPU geometry, voices, materials, listeners, timers or unbounded data structures were introduced.

The post-frame cleanup cannot prove whether the user ever saw a rejected frame. A static/mock foundation test also cannot prove authentic gameplay movement, correctly mixed PCM or precise audible onset. The independent GitHub workflow (native contracts, production build, SHA-pinned CC0 assets and real Chrome/Three.js smoke) is the verification gate; its exact conclusion must be inspected before reporting pass counts.

## Reproduction / next acceptance requirements
```sh
node --test tests/foundation/dungeon-d04-revoked-drawn-pose-retirement.test.cjs tests/foundation/dungeon-d04-swing-rig-receipt-continuity.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```
Further acceptance still requires a matched frozen BEFORE versus candidate AFTER three-viewpoint recording at 1440x900 and 390x844, actual missed swing/impact/block/dodge/ranged/spell and complete Warden warning/release/recovery/earned counter, real decoded video frames and original opt-in Opus with per-cue PCM onset alignment, real resource density/cleanup, and the 20-minute soak. The earlier authentic Chrome smoke ([run 43102388370](https://github.com/my-edutu/Ai_games/actions/runs/43102388370)) passed but its local ffmpeg/ffprobe was absent and decoded motion was UNAVAILABLE: it is not audiovisual timing proof.

## Rollback and next weakness
Revert only the D04 controller/visual pose-retirement changes and their scoped contracts if the isolated integrated Chrome test exposes damage or hazard regressions; never merge or change the legacy default as a workaround. The next dominant weakness is proving timely event-specific original combat foley on actual submitted WebGL frames under slow software rendering, then measuring physical GLB blade-tip travel instead of wrist-proxy motion. No Diablo-IV or production-parity claim is supported.
