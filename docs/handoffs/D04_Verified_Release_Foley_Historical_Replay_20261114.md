# D04 — Historical projectile, spell and Warden release foley replay (14 November 2026)

**Status: focused test-first correction committed; native 326/326 and production build verified. Genuine audiovisual acceptance remains NOT MET.**

## Scope and source provenance

- Only writable ref: `feat/dungeon-d04-combat-feedback-realism-20261108` in `my-edutu/Ai_games`. Starting branch head: `e92318b6158b296e571f9680d0cd0df900f2dcb8`.
- Frozen comparison BEFORE: `281735d0910c6b2443648af976003d50412ee324`. Reviewed repository `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, frozen Dungeon README, current foley/controller/planner and relevant game-audio, game-feel-vfx, simulation-qa and performance-optimization skills.
- Test-first failing commit: [39300ba](https://github.com/my-edutu/Ai_games/commit/39300ba21ed3d1c4e4f3f48d63f9723b1f0b7d30). Source correction: [a58717b](https://github.com/my-edutu/Ai_games/commit/a58717b4bdfcd2e0047a90664e27925fc4c0dddb).
- Source/test paths: `public/ai-dungeon/original-combat-foley.js` and `tests/foundation/dungeon-d04-foley-cue-idempotency.test.cjs`. This third path is handoff documentation only. No main, PR #49, `games/ai-dungeon/src`, rigs, camera, lighting, other session branches or deploy changes.

## Defect and bounded implementation

The preceding D04 cue-ID ring holds 128 accepted IDs. Swing and HP-impact foley already rejected an old event after the ring rotates, but release cues were outside the five-tick verified authority watermark. A formerly genuine ranger projectile, cultist spell or Warden strike could replay original launch/release foley when its accepted ID had been evicted and the sound cooldown expired. This is a reproduced source-level admission bug; it has **not** been observed as an audible replay in real-game captured PCM.

`verifiedReleaseFoleyActor` now recognizes only:
- confirmed `ranged-release` with `visual=launch`, a bounded actor ID and bounded explicit aim target ID;
- confirmed `spell-release` with `visual=cast`, a bounded actor ID and explicit aim target ID;
- confirmed `warden-release` with `visual=warden`, a bounded actor ID and null target.

All require `verified=true`, `proof=authority-action`, matching audio kind, canonical run/floor/tick and exact immutable event ID. The existing successful-scheduling tick watermark now includes these independently confirmed **attempt/release** actions, rejecting anything more than five authority ticks older than the highest successfully played witness. It never upgrades release to hit or attributes HP damage to an actor. Five-tick delayed releases stay eligible; explicit floor/run/reset/disable/dispose clears the existing history. Device scheduling failure still cannot advance the watermark. Unmatched neutral dry-release sounds remain untouched.

No new audio buffers, voice instances, visual pools, generated audio samples, listeners, per-sample loops, timers, external assets or gameplay mutations. Eight-voice and 13,440-sample generated texture budgets, transactional preemption, WebAudio opt-in/mute, reduced-motion/flash, sound density and 400ms rendered-frame submission deadline remain unchanged. Existing legacy spectator is default; only opt-in `?feedback=d04` invokes the replacement.

## Verification results

- [RED native CI 43564806332](https://github.com/my-edutu/Ai_games/actions/runs/43564806332) actually executed `node --test`: **322 passed, four targeted tests failed** because old code returned true for stale ranged/spell/Warden release and a six-tick-old release after a newer witnessed event.
- [GREEN native CI and ongoing Chrome job 43564882629](https://github.com/my-edutu/Ai_games/actions/runs/43564882629): **326 passed, zero failed**, `npm run build` passed; browser `real-preview` was still running at this review point. Do not claim it passed or generated newly verified moving clips.
- Completed preceding [real Chromium Dungeon run 43559880751](https://github.com/my-edutu/Ai_games/actions/runs/43559880751): five browser diagnostics passed; strict acceptance failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. The last sample had desktop and 390px mobile long frame intervals and genuine WebM canvas + audio recordings, but no sample-synchronized impact PCM. Similar multisecond stalls occur in legacy, so D04 causation is not established.
- Earlier [authentic source recordings 43538843846](https://github.com/my-edutu/Ai_games/actions/runs/43538843846) were decoded for comparison: 13 desktop and 19 mobile authority frames; largest gaps 3.533s and 3.356s. This historical evidence predates the correction and cannot establish present sound quality or live combat synchronization. The old decoded montage visibly lacks frame-continuous blade/contact evidence.
- The tunnel-only coding environment was disconnected. GitHub connector safely applied the source and test changes, and GitHub Actions supplied executed native evidence; no local new WebGL replay was claimed.

## Reviews, rollback, next blocker

Specification review: the protected code was untouched, the immutable cue tuple and canonical action type are checked, and source proof remains presentation-only. Engineering review: 26 additions/4 deletions in source at the implementation commit plus four isolated contracts; no budget growth or new hot render-loop work. Roll back `a58717b` only on the D04 branch if authoritative release tuple incompatibility is demonstrated; retain failing regression evidence.

**Next dominant observed blocker remains the genuine multi-second WebGL submission stall** preventing a reliable fresh HP-impact visual and synchronized original sound. Diagnose paired legacy/D04 renderer-phase timings without weakening the 400ms deadline or crossing owners' source. Required evidence still missing: three matched moving viewpoints, both desktop and 390px mobile Warden warning/release/recovery/counter, verified miss/block/dodge/projectile/spell/HP impact and independent decoded PCM alignment, complete mute/reload/accessibility tests and 20-minute resource/cleanup soak. This source-level foley fix is not a physical realism transformation or claimed AAA parity.
