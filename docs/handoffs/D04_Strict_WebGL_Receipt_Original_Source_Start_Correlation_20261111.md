# D04 — Strict WebGL receipt → original WebAudio source-start correlation

Date: 11 November 2026. **IN PROGRESS / NOT SAMPLE SYNCHRONIZED / NOT PHYSICAL REALISM ACCEPTED**.

Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Starting head: `1bec268c846c6c06a5b0d1849ed1dfc5ef600601`. Frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`. No main, PR #49, authoritative rules, rigs, cameras, lighting or other sessions modified. Legacy spectator remains default; D04 only on `?feedback=d04`.

## Dominant evidence integrity defect

The genuine Dungeon Chrome artifact from successful earlier run [43084875707](https://github.com/my-edutu/Ai_games/actions/runs/43084875707) contains four `audio:true` WebGL delivery receipts and authenticated consecutive HP loss. It predates the original sound `source.start()` audit: those four admissions **cannot establish an original started source**. A later browser timeline used a cue-ID-only join to associate a receipt with a source-start record. A matching string alone cannot prove the same scene, tick, semantic recipe or real WebGL submission. Such a join risks falsely reporting event-specific original foley.

The older real screenshot also shows a dense, crowded Warden encounter; it is a historical observation, **not** an AFTER visual comparison or synchronized sound proof.

## Small scoped implementation

1. `tests/foundation/dungeon-d04-source-start-correlation.test.cjs`: seven test-first contracts for real submitted damage/guard/Warden warning identities, bad scene/tick/kind/recipe, missing or duplicated sources/receipts, stale/unsubmitted frames, missing canonical injury proof, and oversized untrusted history.
2. `tests/browser/dungeon-d04-source-start-correlation.cjs`: bounded, pure CommonJS evidence classifier, with a 64-receipt and 32-source audit envelope matching existing controller limits. It joins exactly one real `decision:'delivered'`, `audio:true` receipt bearing a genuine frame ID against exactly one valid, started original WebAudio source of the same immutable `cueId`, scene, tick, kind and declared recipe. Injuries and swings additionally require the prior strict canonical guard. No inferred attacker.
3. `tests/browser/dungeon-physical-feedback-preview.spec.cjs`: genuine seeded Dungeon playback now exports strict `sourceStartMatches` plus a conservative `sourceStartCorrelation` classification instead of the cue-ID-only join. No waveform PTS or cross-clock subtraction. `sampleSynchronized` remains false for every match and the whole experiment.
4. `.github/workflows/dungeon-d04-foley-identity.yml`: include the native classifier contracts in the independent D04 native/build job; re-run when the classifier changes.

No shader, mesh, animation, global lighting, gameplay snapshot, damage/authority, WebAudio bus, foley recipe, voice, retained geometry, timer, mute storage or combat cue planner changed. The 7 pools/104 or fewer instances, 8 voices, 19,200 maximum generated noise samples, 32 pending, 32 audio-awaiting-frame and 400ms stale-audio rules are unaffected.

## Tests and observation limits

- Test-first contracts existed before the implementation; the local isolated test initially failed from a missing classifier module. An independent GitHub red behavioral run was not confirmed.
- A locally reconstructed standalone classifier equivalent passed **7/7 Node `node:test` contracts** and `node --check`. This is not a claim that GitHub-native/production build or genuine Chrome playback has passed at this new head.
- Reclassified the previously archived authentic `visual-room-art-18` run (HP loss tick 3→4, checksum `92c5595b`): four accepted audio receipts but **zero available original source-start audit records**, therefore `SOURCE_STARTS_UNVERIFIED`, zero correlation matches. This conservative result is expected and does not invalidate actual HP-loss evidence.
- Current branch GitHub native/build/Chrome verification, sample-specific decoded PCM onset, 3-viewpoint desktop/390px moving clips, Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell/impact comparisons and the 20-minute soak are still **unverified**. Previous genuine clips and stills are historical, not matched BEFORE/AFTER evidence.
- Reproduction: `node --test tests/foundation/dungeon-d04-source-start-correlation.test.cjs`; `npm run build`; `npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs`. CI D04 workflow triggers on branch pushes, but GitHub runner queue must actually complete before its result may be claimed.

## Specification and quality review

Specification: no impact from a mere swing, no HP mutation, no guessed striker, no foley accepted before actual frame receipt. Audio scheduling and WebGL submitted-frame IDs remain deliberately different clock domains and `sampleSynchronized:false` is mandatory. Ambiguous/malformed/duplicate evidence is rejected, never repaired by guessing.

Quality: classifier uses bounded arrays/maps in a test/evidence module only; no production runtime cost. Successful correlation proves only that an original `source.start()` scheduling record is associated with the same authentic controller receipt, **not** that a particular decoded PCM sample reached a listener or matched visible blade contact. Rolling rings may lack a valid match and should explicitly report unverified rather than pass.

Rollback the four scoped evidence/test/workflow changes on this D04 branch if independent browser verification exposes a regression. Do not merge D04 or change default spectator until the final multi-view, synchronization, cleanup and performance acceptance review.

## Next dominant defect

The authentic WebGL submission path still loses most transient cues during long software-rendering stalls, with zero original foley in one later smoke and sparse actual moving frames; correct the absence of *timely real D04 foley* by diagnosing opt-in/source-start timing against real frame receipt under software and GPU rendering **without relaxing the 400ms deadline**. Separately, the sword ribbon still measures a wrist proxy rather than authenticated GLB blade-tip motion; the crowded real Warden footage fails a credible high-end physical realism comparison.
