# D04 — restore real skinned wrist sampling for sword roles

**Status:** source-level fix on D04 opt-in branch only. **Genuine in-game moving audiovisual proof UNVERIFIED.**

Frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`; review parent `af2b16d0edab0c6afbc96adaa6f6616a9013e245`; branch `feat/dungeon-d04-combat-feedback-realism-20261108`.

## Dominant inspected defect

The previously installed D04 visual trail permitted a swing only when `actor.rigHandBone` existed and sampled that bone every frame. But `model-assets.js` populates `rigHandBone` in `bindRigWeaponAccessories`, whose `rigWeaponParts` list covers *ranger* and *mystic* only. The sword-wielding *vanguard*, *revenant* and *warden* instead expose the real chosen right hand as `actor.rigMeleeBones.find(part==='wrist').bone`, selected from the cloned GLB skeleton by `bindRigArmGestures`. This mismatch suppresses the new measured sword trail on the actual melee actors even when their real wrist animates. This is verified from repository source, **not observed in a live capture**.

## Implemented and bounded

- Read the existing cloned, skinned melee wrist for Vanguard, Revenant and Warden; preserve the existing accessory hand selection for ranger/mystic.
- Reject missing/unloaded, non-bone and ambiguous wrist instances. Do not create a hand pivot, attach any accessory, alter a character rig or treat hand movement as actual contact.
- Wire this selector into both the visual trail eligibility check and its per-frame live hand sampling. The old root-translation/yaw compensation and raw-frame stall gate remain the only motion qualification.
- **No new visuals, meshes, draw calls, textures, audio buffers, voices or synth voices.** Existing seven instanced pools and 102 instance budget remain unchanged; no material, gameplay, state, soundstage, camera, animation or light changes. Default `/dungeon` is unchanged; preview remains `/dungeon?feedback=d04`.
- An attempted swing can earn a measured trail/whoosh, but **only observed HP loss** earns damage fragments or impact sounds; the patch does not invent an attacker. Current opt-in, mute, reduced-motion/flash, frame receipts, deduplication and reset lifecycle are not modified.

## Test-first evidence and verification gaps

Four detached Node 22 contracts were written **before** the selector existed: three failed with missing export, one root-turn control passed. After adding the selector the same four tests passed (4/4). A fifth repository source-wiring contract is committed for CI/worktree execution; **not run in the genuine repository** because the coding/browser tunnel is disconnected. No full build, CI, real Three.js scene, WebM/PCM alignment or 20-minute soak is claimed.

Once the game environment is available:

```sh
node --test tests/foundation/dungeon-d04-melee-wrist-selection.test.cjs tests/foundation/dungeon-measured-hand-trail-d04.test.cjs tests/foundation/dungeon-root-motion-frame-d04.test.cjs tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-d04-audio-frame-deadline.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

The optional GLBs are **not checked into this repository** (`public/ai-dungeon/models` contains only `.gitignore`), and no actual combat clips were found in the inspected tracked tree. Do not claim bone deformation or physical blade-tip verification without installed asset inspection. Capture matching legacy/D04 genuine movement and audio in three views at desktop and 390px mobile, from the same authoritative run/tick/checksum; include missed swing, actual HP loss, block, dodge, arrow, spell, Warden tell/release/recovery/counter and restart. Verify per-frame wrist projection, real blade-tip mesh position, audio PCM onset, WebGL frame receipts and dense 20-minute cleanup.

**Rollback:** revert this one commit only. **Next dominant weakness:** real sword-tip trajectory and impact alignment cannot yet be measured; the trail remains a right-wrist motion proxy, not verified steel geometry.
