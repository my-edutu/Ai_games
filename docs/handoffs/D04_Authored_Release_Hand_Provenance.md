# D04 — Authored arrow/cast release hand provenance

Status: **IMPLEMENTED IN ISOLATED D04 / ADAPTED SOURCE CHECKS GREEN / REAL BROWSER A/V NOT VERIFIED / NOT ACCEPTED**.

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`, starting this increment at `2905080f698f1228d298b8cc599c032a13bfb6ec`. Frozen comparison BEFORE: `281735d0910c6b2443648af976003d50412ee324` (which has no D04 preview modules). No edits to main, Draft PR #49, authoritative `games/ai-dungeon/src`, model rigs, camera, global lighting or other workstreams.

## Source-confirmed physical provenance failure

D04 already required a live firing/casting source at the right action tick, but the hand selector failed to recognize **cultist**, even though the existing model-assets pipeline supplies `rigHandBone` for imported skinned characters. Thus an authored cultist could launch a magical orb from the **static root-height approximation** rather than its animated hand.

A second defect affected authored ranger/mystic emitters: if their hand bone was missing, non-finite, or implausibly far from the visible root, `sampleActor` silently fell back to a static root-height origin and admitted a misleading projectile. A sound may truthfully represent the public action without any visible emitter; a counterfeit physical origin does not.

Before the correction, an adapted V8 probe executing the fetched production modules returned `selectObservedWeaponHandBone(authoredCultist) === null`; it placed the cultist release at `(-7, 1.2, -7)` instead of the supplied measured right hand `(-6.73, 1.45, -7)`, and accepted an authored ranger hand many meters away by falling back to the root. These are **source-backed deterministic mock probes, not filmed GLB observations**.

## Committed changes and interfaces

- `public/ai-dungeon/measured-weapon-trail.js`: read the existing authentic `rigHandBone` for cultist, as already supported for ranger/mystic. No skeleton, attachment or animation-controller changes.
- `public/ai-dungeon/physical-feedback-visuals.js`: authored projectile/spell release now **requires** a plausibly placed, finite, real skinned hand. An absent/invalid/detached joint suppresses the *visual* release instead of inventing a root muzzle. The legacy explicitly procedural/non-GLB body keeps its bounded approximation. Legitimately admitted projectiles continue independent flight, and a target location remains aim evidence only, never damage proof.
- `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`: regression for cultist/ranger hand origins, invalid/missing authored joints, preserved procedural fallback and cleanup. Reconciled three earlier projectile fixtures with the prior session's now-mandatory live firing pose; reconciled an obsolete unmeasured-swing receipt expectation with current measured-blade gating by testing real HP-loss contact instead.

## Evidence and checks

1. Test contract was committed **before** production edits. Initial production-source V8 observation showed both misleading origins described above.
2. After production edits, 12/12 focused adapted V8 assertions passed using fetched D04 modules and bounded simulated Three.js/authority actors.
3. The complete 21-test callback suite in the committed `dungeon-physical-feedback-realism-d04.test.cjs` was executed against fetched production module bodies in an adapted V8 harness and returned **21/21**. This was **not** a native Node test runner, npm build, renderer, Playwright run, or actual character GLB audition.
4. GitHub inspection found no tracked Dungeon `.glb`, `.webm`, `.wav` or `.mp4` in this branch; the separate asset manifest cites CC0-1.0 KayKit source content but does not make models available to the disconnected coding tunnel.
5. Shared coding tunnel attempt: `Tunnel-client has not been seen for 300 seconds`. Genuine Dungeon 1440x900 / 390x844 running-game captures, three matched camera directions, full Warden warning/release/recovery/counter, miss/block/dodge/arrow/spell/HP impact sequences, PCM correlation and 20-minute soak: **ALL UNVERIFIED**.

Run natively, with assets, once the real project environment is available:

```sh
npm ci
npm run build
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
npm run dungeon:stream
```

Open `/dungeon` for legacy spectator and `/dungeon?feedback=d04` for the opt-in preview. Do not promote D04 to default before D10 final integration review.

## Two-pass review

**Specification:** Verified that action and tick checks remain intact; an authored release no longer obtains its origin from a static root on invalid bone evidence. No HP authority, target ownership, collision, attack event or timing was changed. Genuine action cue without drawable VFX can remain neutral/sound-only behind the existing frame gate; it is not a hit claim.

**Quality:** The existing seven retained GPU pools, 102 reserved instances (limit 104), maximum seven draws, eight foley voices, one original noise buffer, bounded pending/receipt queues, read-only sampled bones and frame synchronization are unchanged. No new meshes, raycasts, per-frame emitters, audio nodes or licensed media. WebAudio fresh-click opt-in, persisted mute, reduced motion/flash, dedupe and scene/slot cleanup remain on their prior paths. No measurable FPS, PCM or GLB realism improvement claimed without browser evidence.

**Remaining material risks:** The authentic hand is a grip **proxy**, not verified bowstring or staff-tip/contact geometry. A missing/jittering hand may correctly suppress authored VFX, but its genuine frequency is unknown until moving model inspection. There is no verified Warden strike motion/sound correlation, browser-frame submission proof, mobile readability pass or 20-minute soak. Review recorded root fallback in non-authored procedural models separately without pretending it is authenticated GLB motion.

**Next dominant weakness:** Determine the exact original weapon/casting socket from loaded GLBs and compare first audible original sound onset against first genuine submitted blade/release frames in three matched viewpoints, including stalled frames. Correct only what footage substantiates.
