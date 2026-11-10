# D04 — Animated Warden wrist and recovery-spine localization

Status: **ISOLATED D04 SOURCE CHANGE / ADAPTED TESTS GREEN / GENUINE DUNGEON A/V UNVERIFIED / NOT ACCEPTED**.

Review branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. This increment started from current head `e838e9869ab427eba8dbbc9bd158b2951c669a5f` (not the original, obsolete `d74ab68` or earlier `99530c2`). Frozen pre-D04 comparator remains `281735d0910c6b2443648af976003d50412ee324`. No change to main, PR #49, `games/ai-dungeon/src`, rigs, camera, global lighting, or other sessions' branches.

## Dominant source-confirmed defect

The opt-in renderer treated witnessed Warden release and opening cues as body signals, but `anchor(cue, 'signal')` passed neither `hand` nor `chest` to `sampleActor()`. Thus an **authored skinned Warden** displayed its release and recovery signals around an assumed `root.y + 1.0` position instead of its moving weapon hand or torso. Recent root-following fixes prevented rings floating behind a translating boss but did not attach them to actual animated limbs. This is a **source-level physical-localization defect**, not a recorded real-game comparison.

The existing `model-assets.js` reads the Warden's original `enemy/enemy_swordsman.glb` and binds `rigMeleeBones` entries `wrist` and `spine` when the corresponding bones exist. D04 **reads** those existing skinned joints and never edits a skeleton, animation or asset.

## Exact change

1. `tests/foundation/dungeon-d04-warden-bone-signal.test.cjs` — committed FIRST, two focused regression contracts:
   - A living authored cast Warden's release ring must begin at its observed wrist and track wrist motion. Its opening ring must begin at the skinned spine and track torso motion.
   - A missing/detached/invalid imported joint must suppress authored body art rather than invent a root-height anchor. The explicitly procedural fallback remains available. Resource cleanup is checked.
2. `public/ai-dungeon/physical-feedback-visuals.js` — authored Warden release requests `hand:true`; authored opening requests `chest:true`; both require a real finite/near-body bone through the existing `sampleActor` guards. Chest sampling additionally requires `assetRoot` and an authentic `isBone` joint. Existing frame-by-frame body-signal reattachment retires stale signals. Procedural figures retain their established approximate placement.

**Causality:** These are **action/recovery markers, not contact evidence**. No new damage, hit particles, attacker identification, floor hazards or gameplay rule. No claim that a wrist position proves blade tip or impact; no new Warden strike-to-sample audio alignment. A missing bone suppresses glyph art, not the underlying public action.

## Reproduced check and test status

- RED against the immediately preceding actual source in a detached V8 ES-module adapter: **0/2** new focused tests passed. Release incorrectly anchored at root X -7 rather than observed wrist X -6.69; null imported wrist incorrectly produced a ring.
- GREEN against fetched committed production modules in the same V8 adapter: **25/25** test callbacks passed (23 pre-existing realism tests including the new guard frame-audio contract, plus 2 new Warden tests). This executes real source bodies and test callbacks, but uses deterministic mocked Three.js, not native Node's test runner.
- Branch comparison against `e838e98`: two commits and two files before this handoff, both inside D04 public rendering and test scope. Original seven retained GPU pools/102 reserved instances, maximum seven VFX draws, eight original-foley voices, and 32/32/64 pending/awaiting/receipt budgets are **unchanged in source**. No runtime performance measurement.
- GitHub reported **no commit statuses or PR-triggered workflow runs** for the fix SHA. Native `node --test`, `npm ci`, build, Playwright, real GLB inspection and actual WebGL/WebAudio playback have **not** run. The shared coding tunnel returned `Tunnel-client has not been seen for 300 seconds`, and the separate container cannot resolve github.com. GitHub's `public/ai-dungeon/models` contains only `.gitignore`, not the imported character GLBs or clips.

## Required real-game evidence before acceptance

With actual CC0-provenance assets installed, compare the frozen before and opt-in after on the **same** seed/floor/ticks/checksum. Record genuine canvas frames plus original output-bus audio, at 1440x900 and 390x844 in three matched camera directions. Inspect the Warden's three-beat warning, strike release, recovery, earned counter, miss, block, dodge, ranger arrow, cultist/mystic spell and independent HP-confirmed impact. Assert the imported Warden really has the selected wrist/spine throughout animation, and inspect dropped/late frames. Verify audio gesture/mute/reload, reduced-motion/flash, multiple threats, reset, WebGL recovery, 20-minute soak and allocated draw/audio budgets. If a joint is absent, report suppressed authored visuals rather than retroactively invent a location.

Native commands once coding tunnel and model assets are available:

```sh
npm ci
npm run build
node --test tests/foundation/dungeon-d04-warden-bone-signal.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
npm run dungeon:stream
```

Normal `/dungeon` remains the legacy spectator; only `/dungeon?feedback=d04` uses the preview until D10's separate final review. No unlicensed media introduced. Rollback is a reviewable isolated reversal of the renderer commit; do not merge/force-push.

**Next dominant evidence gap:** A measured **wrist** is not a sword-tip/socket or authenticated contact frame. Use moving genuine GLB captures to correlate first visible blade passage with actual submitted frame IDs and original PCM onset, then derive any subsequent physical timing changes from that evidence.
