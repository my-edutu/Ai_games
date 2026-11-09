# D04 — Evade event versus missed attack foley
**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`. **Parent:** `3774ea8563ee5e699d68b8975265713be6411789`. Frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`. Not production accepted; D04 stays opt-in `?feedback=d04`.

## Source-verified defect
`games/ai-dungeon/src/index.ts` publishes the event kind `evade` when a party hero actually sidesteps, **but also** when a Cultist hex, Revenant breach, or Warden shockwave misses and hits empty stone. The public event contains `{tick,kind,text}` without actor/contact IDs. Previously D04 played a dodge sound on **every** evade event, including entirely stationary heroes, falsely implying a bootstep.

## Presentation-only correction
Require an exact consecutive observed tick, one `evade` event on that tick, and exactly one same-identity living party hero whose action is `move`, actionTick matches, and location differs by one cardinal cell. Only then emit the existing audible dodge and real-position dust. If the observation is stale, there are two events, two possible moving heroes, or no hero moved, emit no `evade` at all. Do not interpret event text. Ordinary missed attacks do not inherit fictional dodges or claim enemy/source contact. Separately measured HP-loss damage remains victim-only; original sword whoosh and all other cues remain unchanged.

## Test-first and evidence
Before the correction, isolated V8 execution of committed-source planner logic reproduced four failures: stationary missed hex, skipped observation, duplicate events, multiple movers. Against corrected planner, eight detached policy checks passed (including legitimate sidestep, latest skipped event, no event, dead actor). These are **detached source checks**, not native repository tests or rendered evidence. Six focused Node tests were authored in `tests/foundation/dungeon-d04-evade-vs-missed-attack.test.cjs`; two earlier tests changed to require silence for unproven dodges.

Recheck when code tunnel and original assets are available:
```sh
node --test tests/foundation/dungeon-d04-evade-vs-missed-attack.test.cjs tests/foundation/dungeon-d04-anonymous-event-time-alignment.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

## Acceptance, budgets, rollback
Seven VFX pools/102 reserved instances, seven draw calls, eight WebAudio voices, one original noise buffer, 32 pending/32 awaiting/64 receipts, opt-in/mute, reduced motion/flash, deduplication, disposal and frame gating are unchanged. No gameplay, actor rigs, camera, lighting, default spectator or PR #49 modification. No seeded simulation/replay change. Caveat: coincidence of an unrelated single hero move with a missed enemy attack is not fully disambiguated by current public events. Only typed authority actor IDs can eliminate that residual ambiguity; D04 cannot add such fields in its ownership boundary.

Native Node/build/CI and genuine 3-view desktop + 390px mobile WebGL/WebAudio captures, Warden sequence, original PCM frame synchronization and 20-minute soak are **UNVERIFIED**. No licensed external samples used. If genuine footage shows false suppression, revert this isolated commit; D10 owns final integration review.
