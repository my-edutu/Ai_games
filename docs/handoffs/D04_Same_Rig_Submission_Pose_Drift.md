# D04 — Same-rig combat foley frame-receipt pose continuity

Status: **source implementation committed; authentic runtime acceptance UNVERIFIED**.
Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Before milestone: `281735d0910c6b2443648af976003d50412ee324`. Prior D04 head: `e0a3183f38c629ba99677a48bdc7909eaac839af`.

## Dominant defect and causal boundary

D04 previously validated the *identity* of the actual GLB wrist when a retained sword ribbon awaited the submitted-frame sound gate. But the very same skinned wrist can move or the actor can turn between the last visual matrix update and the frame acknowledgment. A drawable *old* ribbon would then authorize a whoosh although the newly observed wrist was no longer at the ribbon's submitted pose. This is a same-source **pose-drift race**, distinct from the earlier hot-swapped-rig continuity fix.

**No sword trail is HP damage or confirmed weapon collision.** This correction only protects the temporal alignment of a witnessed attack sound to the last measured cosmetic ribbon; it cannot certify a blade tip, collision, target, or wound.

## Test-first contracts and code

- Tests written first in `tests/foundation/dungeon-d04-swing-rig-receipt-continuity.test.cjs` (`0b41e58`): old retained ribbon + 28cm same-bone move is rejected; 12mm movement with 0.015 rad yaw is accepted; 0.35 rad heading change rejects stale art; after an actual new trail measurement the legitimate whoosh is accepted.
- A later pure contract (`d817721`) covers ±π heading wrap, root-only drift, nonfinite coordinates, different bone identity, and small valid drift.
- `public/ai-dungeon/measured-weapon-trail.js` (`eb52444`) adds a read-only `isCurrentMeasuredHandReceipt` witness. It compares the *same actual skinned bone* with the last ribbon sample and fails closed when wrist/root displacement exceeds **0.06m** or wrapped root-yaw displacement exceeds **0.10 radians**. These constants are presentation-grace tolerances, not collision or physical accuracy tolerances.
- `public/ai-dungeon/physical-feedback-visuals.js` (`9d80bdb`) uses the shared witness from `hasAuthenticatedSwingPose`. The controller already checks that witness at `acknowledgePresentedFrame`, so obsolete drawn sounds retain the existing `revoked-drawn-swing-pose` receipt and do not acquire another listener, timer or queue.

## Review and validation — November 10, 2026

**Verified via GitHub connector:** branch began at `e0a3183`, four commits advanced to `d817721` at inspection; zero behind; changes were exclusively the two D04 presentation modules and one task-specific regression file. The updated imports/exports and source call path were inspected. No main, PR #49, `games/ai-dungeon/src`, model-assets, rigs, camera, lighting, app-default flag or other branch was changed.

**NOT executed:** the new native tests, `npm run build`, Playwright, real WebGL, real WebAudio, or GLB-backed moving playback. The live coding tunnel returned `Tunnel-client has not been seen for 300 seconds`; the separate container could not DNS-resolve github.com. GitHub showed **zero workflow runs and zero combined commit statuses** for the candidate head. These new contracts are **written**, not green. The source inspection does not constitute a runtime pass or a fresh red/green execution. No synthetic or genuine audio audition occurred this session.

**Evidence absent:** recursively inspected current branch tree (2,149 entries) contains no tracked `.glb`, `.webm`, `.wav`, `.pcm`, `.mp4`, `.ogg` or `.mp3` source clips/assets. Real assets may be downloaded outside Git; that was inaccessible from this environment. No 3-viewpoint desktop/390px mobile BEFORE/AFTER, real Warden warning/release/recovery/counter, sword miss, guard, dodge, arrow, spell, HP-confirmed impact, full WebAudio PCM, or 20-minute VFX/voice soak is authenticated.

## Budgets, interfaces and follow-up

No geometry, material, effect pool, draw call, generated audio sample or voice is created. The existing source-defined **seven pools / 102 reserved instances**, max **eight** audio voices, **32** pending cues, **32** awaiting submission and **64** retained receipts are unchanged by this patch. Frame opt-in, persisted mute, reduced flash/motion, scene reset and deduplication follow their pre-existing paths, but were not re-tested here.

Native verification when an approved worktree returns:

```sh
git switch feat/dungeon-d04-combat-feedback-realism-20261108
node --test tests/foundation/dungeon-d04-swing-rig-receipt-continuity.test.cjs
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Then run the acceptance handoff's same-authority 3-viewpoint, 1440×900 and 390×844, opt-in WebAudio + canvas WebM/PCM sequence through real animated GLBs. Compare actual render receipt to audible onset rather than using a standalone waveform. Soak twenty minutes, test consent/mute/reload, background stall, WebGL recovery, simultaneous threats and complete cleanup.

**Next dominant weakness:** even after receipt pose consistency, the *wrist* is not a weapon-tip trajectory. A genuine GLB blade/weapon-geometry witness and actual moving-footage contact/sound review are needed before physical realism or genre parity claims.

**Rollout:** legacy `/dungeon` remains default. Use only `?feedback=d04`. Revert the isolated D04 source commits if native or footage review reveals false suppression; do not merge or deploy from this handoff.
