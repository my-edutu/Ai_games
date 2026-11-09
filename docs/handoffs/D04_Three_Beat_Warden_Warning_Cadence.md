# D04 — Restore the first authentic three-beat Warden warning

**Status:** isolated opt-in source correction; **real Dungeon WebGL/WebAudio playback UNVERIFIED**.

- Repository: `my-edutu/Ai_games`
- Write branch ONLY: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Previous verified HEAD: `d96ff06cc11455b29c3255d8aaef2ba5200fa7c4`
- Test-first commit: `02e5b5f35a5f8ac8de23d25f81089b6fc09b09c5`
- Source correction: `3790a851e671a4a8c9e4754698c7f6a4f1d782a2`
- Frozen BEFORE inspected: `281735d0910c6b2443648af976003d50412ee324` (never modified)
- Acceptance: `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`

## Dominant source-observable defect

In the actual current authority `games/ai-dungeon/src/index.ts`, `planWardenStrike` sets `warningTurns` to **three** for the wide `NOVA` and `ECLIPSE_SWEEP` and **two** for `RIFT_CROSS`; `publicState().bossWarning` provides a legitimate `warning`, `attackTick`, `turnsUntilImpact`, `shape` and real `cells` when in range.

However the D04 planner's `validBossWarning` admitted only `[1,2]`. A real wide Warden strike's first warning at `tick=20`, `attackTick=23`, `turnsUntilImpact=3` was silently rejected. The third retreat/guard preparation beat therefore had neither D04 floor-ring enhancement nor its D04 boss-warning foley. The existing legacy authority danger tiles and gameplay timing were not altered.

This was reproduced against the fetched, unchanged production planner in an adapted V8 evaluator: **NOVA and ECLIPSE_SWEEP at T-3 both yielded zero D04 warning cues**. That is a **source-observable contract defect**, not a filmed browser comparison.

## Focused implementation

1. Committed six test-first public-snapshot contracts in `tests/foundation/dungeon-d04-three-beat-warden-warning.test.cjs`.
2. Allowed a three-turn public warning **only when** `shape==='NOVA'` or `shape==='ECLIPSE_SWEEP'`. The ordinary one/two-turn validity, matching future `attackTick`, real supplied danger cells, stable living Warden owner, immutable cue, chronological retirement and bounded eight-instance signal pool remain intact.
3. `RIFT_CROSS` and an unknown shape still cannot claim a three-beat warning. Multiple living Wardens produce only an attacker-neutral warning, never an arbitrarily assigned body glyph.

No attack contact, victim, HP loss, weapon animation or sound onset is inferred from warning prose. The change is in presentation planning only; authoritative gameplay, rigs, camera, lighting, other session branches and main stay untouched. The normal spectator remains default; D04 is still opt-in `?feedback=d04`.

## Executed verification and limits

- **Red against fetched test-first commit `02e5b5f`: 2/6 passed, 4/6 failed** (both missing three-beat warnings, the three-tick sequence, and anonymous multi-Warden T-3 warning). The other two rejection contracts already passed.
- **Green against fetched committed production `3790a85`: 6/6 passed** in an adapted V8 evaluator running the actual authored test callbacks and current production planner (with the unrelated imported evasion function stubbed). These are **not** native Node executions.
- **Existing stable-Warden / ambiguous-owner compatibility tests: 5/5 passed**, same adapted source evaluator.
- **GitHub compare before handoff**: exactly two commits, one production file and one regression-test file; only permitted D04 scope. GitHub combined commit statuses: no results.
- Native `node --test`, `npm run build`, Playwright, genuine Three.js/WebAudio playback, submitted-frame-to-PCM measurements and 20-minute soak: **UNVERIFIED**. Local worktree unavailable; container DNS could not resolve github.com. The branch tree contains no tracked Dungeon GLB, WebM or WAV media. The procedure cannot falsely replace actual game capture with mocked audio or geometry.

## Proportional native / browser acceptance still required

```sh
node --test tests/foundation/dungeon-d04-three-beat-warden-warning.test.cjs tests/foundation/dungeon-d04-warden-warning-owner-integrity.test.cjs tests/foundation/dungeon-d04-warden-warning-cells.test.cjs
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Compare real `/dungeon` and `/dungeon?feedback=d04` from the identical seed/run/floor/tick/checksum and three camera positions, at 1440x900 and 390x844. For NOVA and ECLIPSE_SWEEP demonstrate both the first T-3 warning and subsequent T-2/T-1 cues with actual danger cells before release; also sample RIFT_CROSS T-2/T-1, missed melee swing versus confirmed HP damage, block/evade, projectile/spell, Warden opening/counter and final restart. Record genuine canvas WebM plus original opt-in sound PCM/WAV and measure action → pose → frame-submit → sound onset. Inspect simultaneous threats, opt-in/mute/reload, reduced settings, long frame stalls and 20-minute retained-resource cleanup.

## Constraints, review, rollback

- **Budget:** no new GPU mesh, pool, instance, draw call, audio buffer/voice, delayed timer or queue. Existing seven pools / 102 instances, max eight sound voices, 32 pending effects, 32 audio-awaiting-frame, 64 receipts, dedup and cleanup unchanged in source. Actual WebGL/audio budget measurement remains outstanding.
- **Specification review:** this preserves the three-beat public authority warning for the wide shapes, while refusing a fabricated third rift beat or arbitrary boss identity. Damage, attacker and contact remain authoritative.
- **Quality review:** repeated genuine warning updates at T-3 and T-2 may increase audible boss alert density; compare real in-game mix and mobile readability before any default migration. This source correction alone does not establish improved cinematics or physical contact fidelity.
- **Rollback:** revert the `3790a85` production correction on D04 only if authentic playback shows regression; keep the regression contract for independent review.

**Next dominant weakness:** Warden release sound is still related to the witnessed authority cast rather than verified animated weapon/contact onset. Sword streaks still trace the observed wrist rather than authenticated blade tip. Both need mounted GLB rigs, matched moving gameplay and original bus PCM to guide an evidence-led physical synchronization change.
