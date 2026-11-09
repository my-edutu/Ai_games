# AI Dungeon — Session 03: source-rig full-body animation handoff

**Milestone:** M1 transformation / isolated animation workstream. **Status:** implementation candidate; independent full-game motion acceptance pending. Not a claim of AAA fidelity, finished IK, production readiness or a Gauntlet victory.

**Upstream:** Draft PR #49, `feat/ai-dungeon-3d-gauntlet-foundation`. This branch is deliberately separate because the artwork and renderer-performance sessions must not overwrite the same working tree. Do not merge into main. Rebase/cherry-pick into PR #49 only after comparison and passing checks. Frozen authority, AI, combat rules, cameras, environment, particles, sound and materials are not changed by this session.

## Physical source / provenance

The existing pinned KayKit-derived **CC0-1.0** GLBs remain the animation source. Asset manifest `games/ai-dungeon/assets/manifest.json` pins `sion-rgb/tactical-slash` revision `8bf8d835cb7afa7cb3f4d893b0966c6b4e9b7727`, file SHA-1 and byte size; the actual binaries are downloaded and verified by `npm run dungeon:assets:strict`, not committed as substitute geometry. Original assets and source skin weights are untouched.

| Actor | Current production rig | Motion role |
|---|---|---|
| Vanguard | `player/player_swordsman.glb` | defensive, planted forward cleave |
| Revenant | `enemy/enemy_swordsman.glb` | opposing stance, hooked forward strike |
| Warden | `enemy/enemy_swordsman.glb` | heavier overhead and genuine telegraphed windup |
| Ranger | `player/player_archer.glb` | ranged follow-through, distance-based gait |
| Mystic | `player/player_priest.glb` | casting release, distance-based gait |
| Cultist | `enemy/enemy_priest.glb` | casting and receiving damage |

*Clip inventory is captured from each actual loaded GLTF in `sourceClipAudits`: original name, duration, animation-track counts by transform type and potential root-motion tracks. The source names are NOT invented here; the live browser audit is required to report them. The audit rejects malformed clips and never modifies the source scene or source animation.* Selection remains `idle/run/walk/attack/cast/hit/block` name-based fallback in `chooseClip`. Unrecognized rigs and missing binaries retain the prior procedural fallback.

## One-action pose ownership (explicit migration)

`public/ai-dungeon/full-body-animation-controller.js` is a pure, deterministic read-only arbiter. It derives a single active physical role from the **real public actor**, actual rendered movement, a same-actor positive-HP-loss record or a source-verified legal one-cell evasion. It does not issue any combat command or synthesize an enemy. Priority:

1. **Defeat:** true HP=0 releases gait, combat, threat and warning poses. Existing imported skeleton receives genuine fatal-collapse pose / authentic intermission tableau.
2. **Hurt:** matching `id` and `kind`, positive damage, positive maxHp, and age [0, 0.55s) as emitted from successive authoritative snapshots. A stale `hurt` label alone is deliberately not enough.
3. **Evade:** same actor/id/kind and a verified cardinal one-cell escape event with valid event tick, before 0.58s. Suppresses combat/cast overlays during the dodge.
4. **Attack:** real actor attack. A valid adjacent living target, clear wall/contact plan, and a genuine source actionTick still gate native planted melee; no attack based on mere proximity.
5. **Cast:** genuine actor cast; original imported one-shot with ranged skeletal gesture as relevant.
6. **Guard:** original real guard stance.
7. **Move:** true rendered displacement of a live actor; not a stale server move label, teleport or a frozen actor.
8. **Idle:** default.

All imports are still owned by Three.js `AnimationMixer`, which owns **base joint rotations, original keyframes and authored animation clocks**. Named post-mixer overlays have narrow responsibility:

| Channel | Pose owner | Conflict resolution |
|---|---|---|
| Source skeletal base | `AnimationMixer` with source clips | One selected action with one-shot tick and bounded crossfade |
| Lower-body travel | `advanceRigGait` + original thigh/knee/ankle bones | Only if arbiter assigns real locomotion |
| Foot loading | `planConstrainedFootSupport` | Small reversible, phase-aware ankle/knee counter-rotation; disabled on teleport, interruption, death and reduced motion |
| Pelvis/chest/head | `planRigBearing`, `planRigFullBodyStride`, `planNativeDuelPose` | After source mixer, same authoritative action; native melee suppresses older duplicate stance arcs |
| Sword/contact body | `planNativeDuelPose` and validated melee pose | Verified adjacent contact; legacy root lunge and duplicate contact overlays suppressed |
| Casting and ranged release | Existing pose plans | Action-appropriate only; not while hit, evading or defeated |
| Hurt | Existing true-HP-loss skinned response | Takes precedence over attack/guard, retains verified positive-damage timing |
| Escape | Existing genuine evasion plan | Only a valid matching recorded escape can take ownership |
| Warden charged tell / strike | Existing verified boss-state warning | Temporarily releases neck, shoulder, elbow, spine, thigh and root ownership during true hit or evade |
| Defeat | Existing skinned-collapse and aftermath system | HP zero is absorbing until authoritative revival/transition |
| Cloth | Existing `fabric-drape-plan.js` source-attached panels | Updated to follow the owning full-body action; only verified evasion runs its bounded cloth-lag envelope, injury follows the real damage age, and defeat holds a neutral settled drape |
| Grip | Original skinned GLB hand attachment | Existing hand bone / SkeletonUtils clone contract remains unchanged |

**Restore protocol:** Before every Mixer update, remove the previous frame's known quaternion deltas for arms, forearms, legs, pelvis, chest, wrist, head, and cranial scale. After the source Mixer, apply only current owner outputs, preserving the correct order. No permanent bone bind edits and no authority-pose drift. Clips return from a real interrupted animation at the legal current clip age, rather than producing a second faux windup. A new authoritative actionTick alone starts the next fresh one-shot. Even the same imported clip can be explicitly replayed for a later legal attack tick.

**Fitting contract for Session 02:** Provide a SkeletonUtils-cloneable source rig with uniquely identifiable head, pelvis, upper chest, left/right upper arms and forearms, left/right thigh/calf/ankle, right-hand grip, bounded bone scales, one attached original weapon and source clips with meaningful names and track durations. Model conversion/relabeling/retargeting belongs in an explicit *adapter* outside this session, not an undocumented animation-controller assumption. Current selection helpers in `rig-attachment-plan.js` remain the contract and gracefully omit missing joints.

## Verification strategy

### Repeatable nonbrowser

`npm run dungeon:test` includes the original native-duel tests and the new `dungeon-full-body-animation-controller.test.cjs` suite. Assertions cover animation ownership across movement, attack/contact/recovery, legal new-tick restart, hit and evade interruption, source-clip audit, bounded and idle-safe ankle support, and renderer integration signatures. All pose planning is deterministic and free from randomness, network calls, wall-time inputs and authority writes. Real replay equivalence is checked by the existing authority campaign `npm run dungeon:gauntlet`, not assumed.

### Actual full-game trials

`dungeon-full-body-animation.spec.cjs` is included in the dedicated Three.js Playwright suite; it uses **unmodified DungeonRuntime.step()** snapshots, chooses genuine party attack and displacement, loads actual locally verified CC0 GLBs into running Three.js and captures moving real browser WebGL evidence:

- `artifacts/dungeon-full-body-real-attack.png`: genuine visible attack with recorded actor ID, source tick, joint count, clip inventory and owner.
- `artifacts/dungeon-full-body-real-travel.png`: genuine displacement with original skinned leg bones and bounded foot-support diagnostic.
- Playwright recording `test-results/**` and screenshot evidence are uploaded automatically by the Dungeon browser workflow.
- Existing `dungeon-authored-motion.spec.cjs`, `dungeon-rig-attachments.spec.cjs`, and original full-journey tests remain mandatory deformation / weapon continuity / combat coverage, not replaced by these snapshots.

**Acceptance evidence is not yet claimed.** CI must execute against this exact branch HEAD and produce inspectable moving gameplay, not just static code assertions. Full corridor-to-boss/restart, long-video clip cadence, high-motion shoulder–weapon coupling, edge-case skin and cloth deformation, phone viewport, and matched pinned baseline (`281735d0910c6b2443648af976003d50412ee324`) require actual independent review.

## Follow-on implementation — unified footfall and planted idle arrival

The previous second native-gait oscillator could become dephased from the existing distance-derived ground stamp and footsteps after a genuine attack interrupted traversal. This candidate now binds source thigh/knee/ankle and opposite torso/shoulder stride to the **same** `groundedPerformance.footPhase` that owns actual stamped footsteps. A new `alignRigFootfallPhase()` contract rejects invalid phase inputs and resets only on genuine teleport, hard action interruption or accessibility stop.

When a legal traversing actor naturally settles into idle, `advanceRigGait()` now accepts bounded `frameDelta` and fades the last planted pose over a short fixed physical interval rather than snapping the feet and pelvis to neutral. Attack, cast, guard, genuine injury, verified evasion, defeat, floor teleport and reduced-motion still release it immediately. The existing `planConstrainedFootSupport()` remains bounded visual joint counterrotation: **not** world-space IK or proof of a locked foot mesh. Browser diagnostics now expose live frame phase error and settling actor counts; browser tests assert bounded real-body phase alignment, and pure tests exercise parity, stage continuity, impossible teleports and exact rest.

`dungeon-fullbody-animation-session.yml` now includes **two separate exact-code organic film jobs** (desktop 1440px and mobile 390px), using unmodified `DungeonRuntime.step()` over the actual connected entry → combat → Warden → floor → defeat/restart milestones, with WebGL video and genuine opt-in original WebAudio. These are **scheduled validation requirements**, not already inspected successes. This additional recording cannot replace independent judged matched baseline comparison.

## Resource / correctness budget

- One small per-source-actor controller state and one clip-audit object; no clone of GLB geometry or animation clips, no new SkinnedMesh, Mixer or GPU draw call.
- Bounded, previously cached source-bone quaternion mounts and no altered authority coordinates.
- Counter-rotations capped to approximately 0.062 radians per foot support update; synthetic support no more than existing native animation layer budgets.
- The extra `sourceClipAudits` diagnostic is limited to six rendered actors and 80 imported clips / 1500 tracks per clip; for production monitoring this should be reduced to aggregate counts rather than repeatedly serializing per-frame.
- This is *not* yet a verified two-bone constrained IK solver: it produces low-risk, genuine-bone planted-weight assistance but not proven world-space sole locking. Actual planted-sole lock, stretch limits and rigorous deformation sampling must follow imported rig/bind audits.
- If a source clip already translates its entire armature root, the new runtime audit flags the track but does not forcibly strip it. A verified per-rig root-motion adapter remains a required quality gate before declaring fixed foot skating.

## Rollback and integration boundary

Cherry-pick/review this branch as an independent animation candidate after CI and visual critics. Revert the animation controller, its imports/gates, service route and tests together to return to the original action-only mixer. **Do not merge this independent workstream to main or overwrite PR #49 while the Gauntlet sessions are active.** Other sessions may modify source asset appearance or renderer timing; merge conflicts must be resolved explicitly at the `model-assets.js` interface with matched real gameplay replay.

## 8 November — source one-shot continuity repair (follow-on implementation)

**Why this matters to LOOK/FEEL:** The authoritative DungeonRuntime resets each unit action and actionTick every fixed 350ms tick, while the current native melee and casting one-shots require approximately 620–640ms for anticipation, contact, recovery and a planted settled stance. Simply selecting the latest server action caused the imported sword/spell skeleton to abandon its recovery when the server legitimately returned to idle. A pose that cannot finish does not satisfy the continuous full-body goal, even when all single-frame pose tests pass.

**Change, isolated to Session 03:**

- The full-body arbiter now retains a previously observed **real attack/cast visual recovery** through at most one subsequent *idle* authority tick, only while alive, motionless and without a new damage beat, escape, guard, movement or fresh action. Its actionTick remains the originally witnessed one; no repeated impact is authorized. The visual age is bounded by at most 50ms per rendered update and finishes no later than 620ms for melee or 640ms for cast. Skipped authority ticks and reduced-motion preference release the hold.
- The native AnimationMixer, rigid foot support, hips, source shoulder/elbow/wrist, torso/physical root and existing cloth panels now use that single selected visual age. One original action can therefore reach recovery without two overlapping motion clocks. The original event source tick, not the later *idle* tick, is the animation restart gate.
- A genuine adjacent contact may be remembered **for posing only**, when `planCombatFacing` matched the exact explicit authority target ID at range 1 with finite yaw. During this one-tick recovery the original planted stance can settle even though DungeonRuntime erased targetId on idle. This cached contact **never enters authority, hit detection, particles, audio, combat director or victim attribution**. Unknown/wrong/distant targets never create a contact pose.
- A real attack on a new legal source tick restarts correctly. True HP loss, legal evade, defeat, movement, guard, connection-skipped ticks and accessibility override the old animation. The controller emits separate `holding`, `completed` and `confirmedContact` flags. Read-only WebGL counters report held-recovery and genuine-contact-recovery frames.
- Unit regression tests cover fixed-tick transitions, natural settling, legal interruption, wrong-target rejection, actor-bound positive HP loss and stale event suppression; one new Playwright trial retrieves **consecutive genuine DungeonRuntime.step()** snapshots for an adjacent attack then a real idle step, and captures real GLB recovery only if it actually plays. Existing desktop/mobile journey workflows remain enabled.

**Execution evidence:** At exact candidate-source inspection, 13 standalone controller/integration logical checks passed and five changed JavaScript files passed syntax checks. **These are not running-game or source-GLB deformation proofs.** The branch-scoped dedicated native-rig, video, strict-assets and organic desktop/mobile actions were queued/pending at last inspection. The connected local coding/browser tunnel reported `Tunnel-client has not been seen for 300 seconds`; this session cannot claim inspected new-head actual animation videos or blind critic acceptance. The global transformation ledger remains under the PR #49 Gauntlet owner; this independent session does not mark it passed or reset the frozen baseline.

**Remaining:** exact-head test results; confirm no pre-contact illusion; GLB deformation/weapon grip/foot penetration in true moving footage; check no new animation stalls at low FPS; combine with Session 02 cast; compare the full original five-stage desktop/mobile journey against frozen baseline; require independent majority preference in LOOKS, FEELS and PLAYS. Preserve this PR draft and avoid main deployment/merge until independently verified.

## Session 03 — live source-skeleton deformation gate

The next measurable risk is whether imported skinned limbs remain anatomically connected **in the actual moving dungeon**, not merely whether animation functions return nonzero angles. This matters before Session 02 supplies new character assets.

**Implemented in this isolated draft:**

- `native-rig-deformation-plan.js` adds pure finite-length and quaternion/matrix contracts for actual source forearm/hand and thigh/calf/ankle chains, distinguishing detached hierarchies and limb stretch from legal whole-body movement.
- The `model-assets.js` adapter samples only SkeletonUtils-cloned source bones already selected by the rig contract. It caps inspection at 12 source actors and 128 bones per actor, records at most eight linked limb segments per actor, and stores a per-clone reference pose in a WeakMap. No joint/mesh/authority transforms are changed by the audit.
- The renderer exposes explicit read-only `window.__DUNGEON_SOURCE_RIG_DEFORMATION__()`; the audit is **on demand**, not a per-frame animation or GPU expense.
- Foundation tests check intact original chains, rigid movement invariance, deliberately disconnected limbs, physical segment stretch, malformed quaternions/matrices and invalid numerical input.
- Genuine-authority WebGL walking and sword tests now compare before/after ORIGINAL source-bone measurements. The organic desktop/390px five-stage tests audit the actual entry, ordinary combat, Warden, floor, defeat and restart frames. Evidence goes into existing exact-source screenshots/JSON/recording artifacts.
- Dedicated Session 3 GitHub Actions and the foundation npm suite include the new tests.

**Verification level:** Eight isolated pure-contract logic checks and JavaScript syntax validation of seven changed files passed. These are not real GLB deformation passes. GitHub Actions and real moving-game captures were still queued/uninspected when this update was written; the local coding/browser tunnel was disconnected. Do NOT assert delivered audiovisual proof, world-space sole locking, weapon contact quality, improved animation fidelity or finished Gauntlet.

**Required next:** inspect exact-head 1440px and 390px WebM, check source weapon-hand and foot-to-stone continuity, repeat real Warden strike/recovery/defeat from multiple directions, reject visible mesh/skin distortion, verify interruption after reconnect/restart, then compare with permanently pinned baseline and request independent LOOK and FEEL reviews. Global LOOK/FEEL/PLAY is owned by PR #49 and remains unverified.

### Defeat-to-rest source-clip ownership correction

While the source-keyframed chest and shoulders received the genuine HP-zero collapse, the imported idle/walk clip could continue cycling underneath the corpse, making a defeated actor appear to breathe or step. The Session 3 adapter now **holds the last legal imported source skeleton keyframe** when the authoritative HP-zero controller owns the pose. The existing `planSkinnedDefeatPose` continues to advance using real death age and supplies the collapse; source playback alone is zeroed (`mixer.update(0)`) and the old living clip is not replaced with a fresh looping idle animation. A later legitimate revival or newly spawned actor restores normal mixer behavior without carrying frozen quaternions across character clones.

Tests: new pure controller contract for HP-zero persistence and legal restoration; existing real-seed Chromium last-stand test now demands an actual source-rig freeze counter while the original skinned collapse remains visible. No scripted death or altered gameplay rules. **Real latest-head visual output remains UNVERIFIED until the pending CI job produces inspectable video**, including confirming that the frozen source pose does not make a sword hang unnaturally after a fatal blow.

## 8 November — physically coherent imported clip clocks under slow WebGL

**Source-level quality risk, pending video ranking:** Existing `mixer.update()` caps imported CC0 GLB clip advance to 50ms per frame even if the same real authority action and reversible full-body shoulder/wrist/pelvis/sole pose advanced further. At low render FPS, the native sword/hand skeleton could still be in windup when its one-action owner has reached legal contact/recovery. This is a code-derived defect hypothesis, **not** a verified observed-film ranking.

**Animation-only candidate:** `planImportedOneShotPhase()` connects current imported source pose time to the same actor's real one-shot event age; correction requires >28ms phase error, with at most 125ms forward catch-up per frame; the subsequent monotonicity repair prohibits backward source scrubbing. Original `AnimationMixer` still evaluates one native source skeleton with valid crossfades; crossfade warping no longer overrides explicit licensed clip retiming. No fabricated hits, enemy targets, footsteps or combat events. Terminal HP-zero, ordinary locomotion, guard, evasion, invalid clocks and accessibility reduced motion cannot seek clips. Runtime counters measure phase correction/peak error; on-demand genuine source-rig output includes action duration, time, speed and remaining phase difference. No new geometry, skin, draw calls, GPU resources, authority or simulation mutations.

**Validation status:** Seven isolated pure-helper Node.js contracts passed in an offline scratch harness. Repository-wide tests and rendered original GLB playback remain UNVERIFIED while the connected local coding/browser tunnel is unavailable. The previous exact-head run for `774c6a9089829404fe211922f72601a4b13b9042` was queued, with 36 prior Session 3 Actions runs cancelled. This follow-on commit must receive a new exact-SHA build, full foundation/gauntlet/strict-assets run, and original 1440px + 390px WebM with entry → ordinary combat → Warden → floor → natural defeat/restart. Inspect real melee/cast clip retiming, original hand–weapon coupling, sole-to-stone sliding, source skin deformation, interruptions and browser FPS before accepting. Compare to immutable `281735d0910c6b2443648af976003d50412ee324`; request independent critics; do not integrate PR #49 or mark global TRANSFORMED_VERIFIED.

## 8 November — verified original GLB Ranger source clip and selected-release correction

**Reproduced source-level defect (not yet a latest-head visual verdict):** The previous
generic first-/attack/ clip lookup chooses
`1H_Melee_Attack_Slice_Horizontal` for a Ranger's *real ranged attack*,
despite the original 41-joint archer rig containing its
`2H_Ranged_Shoot` whole-body release. A red local test reproduced the
mismatch on the exact licensed clip inventory. The new pure selector
uses the real ranged release on Ranger attacks, retaining existing
Vanguard/Revenant/Warden melee and Mystic/Cultist cast selection. The
three-dimensional source skeleton, timing authority, hand attachment,
actual projectiles/damage and all non-animation systems remain unchanged.

**Original rig evidence:** Unpacked immutable-baseline GitHub Actions run
`41302939553`, artifact `13082028432`. The six CC0 GLB binary Git
hashes exactly equal the current asset manifest values. Each asset has
one skin, **41 named source joints**, and seven genuine clips with
123 channels each (41 translations, 41 rotations, 41 scales):
`1H_Melee_Attack_Slice_Horizontal` 1.042 s,
`2H_Ranged_Shoot` 1.042 s, `Death_A` 0.792 s,
`Hit_A` 0.667 s, `Idle` 1.042 s,
`Spellcast_Shoot` 0.917 s, `Walking_A` 1.042 s.
Both feet/toes and right hand/handslot are present, as are source
root positional tracks; **world-space foot planting remains unverified**.

**New acceptance contracts:** Pure regression checks preserve all six actor
role choices, legal missing-clip fallback and the actual model-selection
integration. A new Playwright browser test uses the unmodified
`DungeonRuntime.step()` observed Ranger action, proves
`2H_Ranged_Shoot` is selected and reports the source tick, original
bone integrity and authentic WebGL frame. The read-only per-actor
`sourceClipBindings` diagnostic exposes role/action/selected clip/tick.

**Verification boundaries:** GLB inspection and the old selector's
failure are confirmed offline. New exact-branch tests, strict assets,
24×900 deterministic campaign and real desktop/mobile WebM
are **pending**, not passed. The coding/browser tunnel was disconnected;
Session 03 had 37 earlier CI runs cancelled by rapid pushes and the
latest repository Actions sample had 98 of 100 runs queued.
Do not claim that the new source release looks better, is contact-synchronised,
or passes blinded LOOK/FEEL/PLAY until exact-HEAD video and critics
are inspected. Leave PR #72 draft, protect PR #49, and do not merge.

**Next executable gate:** inspect new exact-SHA CI without additional
push-churn, then compare genuine moving ranged draws and recovery,
source skin/hand continuity and real 390px/desktop Warden journey
against frozen `281735d0910c6b2443648af976003d50412ee324`.

## 8 November — independent original GLB inverse-bind deformation reference (Session 03)

**Evidence-integrity repair, not a visual-quality claim:** The prior deformation checker used the first observed animated pose as the limb reference, guaranteeing a potentially false first-frame zero. The on-demand probe now caches limb lengths from the imported SkeletonUtils-cloned GLB's `skeleton.boneInverses`, transformed into its fitted world space, without posing or altering source joints. It rejects nonfinite/singular matrices and exposes a `bindReferenceComplete` flag rather than silently accepting incomplete bind data. New unit and exact WebGL desktop/390px tests require all eight original arm/forearm/thigh/calf references before using stretch metrics. Resource ceiling: at most 128 original-joint inversions once on the first inspected clone, no animation-frame work or GPU draws.

**Evidence pending:** Full Node suite, actual GLB bind-space compatibility, 24×900 deterministic campaign and genuine mobile/desktop five-stage WebM remain unverified until the new exact-head Actions job executes. An invalid fit or incomplete source boneInverses will now cause a visible strict-test failure, not a false clean bill. This is not world-space sole locking, weapon-to-hand evidence or final animation approval. Original-source art, combat authority, other sessions, PR #49 and main are untouched; do not mark global Gauntlet verified.

## 8 November — monotonic original GLB one-shot clock (Session 03)

**Confirmed pure-planner regression, not claimed real-film frequency:** The original `planImportedOneShotPhase` allowed up to 55 ms backward presentation-time seeking per rendered frame whenever an imported clip was ahead of its one-action owner. Tests against the exact parent source found **36/36 retrograde source-time transitions** across attack/cast/hurt and speeds 1, 1.35, 1.68. A seven-frame cast reproduction from source time .370s and real action visual age .140s yielded .331, .292, .253, .214s before forward motion resumed. Abrupt backward skeleton-time sampling risks reverse wrist, weapon and feet poses; the true prevalence and severity in the running game remain unknown without current-head moving footage.

**Test-first animation-only correction:** Drift seeking now advances original keyframes only, capped at 125ms presentation-time catch-up per rendered update; it never scrubs an uninterrupted source `AnimationAction` backwards. A genuine later actionTick still resets its own imported clip through existing `changeAction` and crossfade ownership. Pure negative phase drift remains measurable by the planner and runtime reports its remaining magnitude, rather than introducing a reverse rewind. Added a 36-case regression and sequential seven-frame monotonic source-time gate; no combat/AI, hit, target, rig geometry, material, audio, camera, HUD or particle changes.

**Validation:** Exact-source JavaScript isolated regression reproduces RED before and GREEN after; 36 ahead-of-owner variants plus forward correction and parser checks were evaluated. The Node/Playwright suite, actual imported GLB pose deformation and hand/weapon trajectory, 24×900 authority replay, 1440px and 390px five-stage WebM/PCM, matched baseline and independent critics **have not run on this new candidate** while the browser tunnel is disconnected and GitHub Actions jobs are queued. This fixes a mathematically demonstrated continuity hazard, **not** the largest ranked film-observed defect or a final animation Gauntlet pass. Preserve the draft PR and original rig adapter contract; do not merge or update global transformation ledger.

## 8 November — lawful late-observed imported one-shot entry alignment

**Measured source-level continuity problem, not yet a film ranking:** The previous `changeAction` reset a newly noticed original GLB clip to source frame zero even when the genuine render owner had already reached a lawful action age. For the authentic 1.042 s melee clip retimed to 0.620 s, noticing the real contact at age 0.215 s previously put the original joint animation at 0 rather than approximately 0.361 s. The bounded forward-only catch-up then required additional rendered frames while shoulders/pelvis were already in recovery. This may cause an observable apparent second windup, but current-head footage has not confirmed its frequency or severity.

**Changed only this Session 3 presentation:** `planImportedOneShotEntry` aligns a *newly selected* original attack, cast or proven hurt clip to the genuine action age, with original-clip time bounds and no change to simulation, HP, hit, facing, model, bind, weapon, geometry, camera, VFX, materials or audio. It cannot seek an uninterrupted source clip, defeated/evasive/idle actors, malformed ages or reduced-motion playback. Existing forward-only continuous source clock correction and native crossfades remain in place. No other branches or files outside animation ownership are changed.

**Test-first bounded local proof:** Offline Node.js red/green scratch checked the previous zero-start rule against six licensed-duration scenarios: five of six late-entry cases disagreed, while the new rule passed six of six and 13 invalid/continuity/accessibility cases. Two repository contract tests have been included, but the repository test suite and real Three.js playback remain unrun until CI executes. The user's immutable comparison baseline remains `281735d0910c6b2443648af976003d50412ee324`.

**Exact-head acceptance still mandatory:** The predecessor exact-head [Actions run 42477575883](https://github.com/my-edutu/Ai_games/actions/runs/42477575883) was pending with all three jobs queued and zero current-head video artifacts at the start of this correction. The new branch SHA must complete source-rig/authority tests, 24×900 campaign and actual moving desktop/390px entry→combat→Warden→floor→natural defeat/restart footage. Independently judge source draw/contact and recovery at real fps, weapon attachment, foot planting, deformation and interruption. Prior PR #49 incomplete/sparse recordings are not current-head evidence. PR #72 stays DRAFT and unintegrated; no Gauntlet pass is claimed.

## 8 November — genuine source Death_A (provisional)

Original pinned licensed rigs contain a 41-joint, 0.792s Death_A, but the previous HP-zero owner selected living Idle and froze the current motion. This branch now plays the original native Death_A once on actual HP=0, holds its terminal keyframe, and suppresses the old additive angular collapse to prevent double-posing. Missing death clips and reduced-motion spectators retain the prior frozen-source fallback. No GLB, geometry, camera, sound, particle, simulation, hit or AI change. Legal revival releases the fatal owner. Pure exact-source RED: Idle selected at HP zero. Pure patched GREEN: Death_A and lawful revival. Full Node, video/GLB deformation, original 390px and desktop evidence, and blind comparisons are PENDING; reject any visible deformation/weapon/restart regression. No Gauntlet acceptance or upstream integration.

## 8 November — prevent authentic death-source restarts on every server tick

**Reproduced from exact code, not claimed from a current-head WebM:** The authoritative `DungeonRuntime.step()` increments `unit.actionTick` for **all** units every 350 ms, including HP-zero actors. Previously `changeAction()` treated **each** changed tick as a new `defeat` one-shot and reset the original 0.792-second `Death_A` clip. A naturally defeated body could therefore repeatedly rewind toward the opening collapse rather than reaching the licensed terminal pose. Pre-fix isolated eight-tick truth reproduction finds seven false death restarts. This is a definite source-level scheduling conflict; its visual incidence and severity in current-head WebGL remain UNVERIFIED.

**Scoped animation-only correction:** Pure `shouldRestartImportedOneShot()` now starts authentic native death exclusively on an actual transition into the HP-zero source action. Subsequent authority ticks do not reset it, including a spurious `forceRestart`. Revival transitions to a living source action, so a later genuine death can start normally. Attack, cast, witnessed hurt and source clip retiming retain their existing legal new-tick behavior. Neither HP, combat, AI, source GLBs, weapon attachment, camera, HUD, material, sound, cloth systems, particles nor other branches were changed.

**Test-first coverage:** The new foundation regression checks 14 consecutive deceased authority ticks, a later genuine death after revival, living one-shot tick events, repeated render frames and the actual authority tick-update signature. A standalone exact-logic mirror passed nine cases and reproduced seven erroneous restarts before the correction; **the repository Node/browser tests have not executed in the disconnected coding environment**. This is a player-visible animation *hypothesis* until the new exact-commit CI and moving 1440px / 390px original GLB WebM are independently inspected.

**Next executable validation:** Let the new head's dedicated three-job workflow complete. In the genuinely witnessed entry → combat → Warden → floor → natural defeat/restart journey, inspect the same actor's `Death_A` source time across successive REAL authority ticks, confirm no relaunch or snap, terminal grip/mesh integrity, and lawful revival. Confirm clip completion despite real render starvation; compare genuinely matched before/after original scenes. No independent LOOK/FEEL/PLAY signoff; PR #72 remains DRAFT and PR #49 unmodified.


## 8 November — native Death_A cadence under genuine old WebGL starvation

Original desktop/mobile organic WebM from predecessor run 42427983542 (source c51342c, NOT this PR head) showed approximately 0.67–1.07 actual rendered frames per second in selected combat intervals. The previous exact source mixer capped original animation progress at 50ms per rendered frame: an authentic 0.792-second death therefore takes 16 visible frames to reach its terminal pose in severe stalls. This is a mathematically reproduced timing hazard grounded in predecessor cadence, not a current-head visual verdict.

Session-03-only correction: pass the existing raw frame interval and visibility through the animation adapter; the genuine authorized imported Death_A alone can catch up by at most 280ms per visible frame, clamped at the original source clip endpoint. It preserves three intermediate source-frame evaluations under extreme stalls. Living attack/cast/hurt/gait/guard/evasion/idle, normal-rate playback, hidden-tab and reduced-motion behaviour retain the previous 50ms bound. No combat, AI, game clocks, grid movement, assets, grip geometry, camera framing, HUD, material, audio or particle changes.

Test-first: the old cap fails an offline three-frame expectation (16 != 3), while an isolated new pure-helper Node reproduction passed for three-frame progression, 60fps, terminal clamp and invalid/accessibility/living-mode guards. Foundation tests and adapter integration assertions are committed but have not executed in the disconnected code/browser tunnel. Current-head strict GLB deformation, 24x900 replay, native 1440px/390px five-stage videos and independent LOOK/FEEL/PLAY are PENDING. Preserve draft PR and exact-head CI; no integration recommendation or Gauntlet signoff.

## 8 November — bounded living attack/cast source performance under sparse WebGL

**Evidence:** Earlier authentic predecessor source `c51342c` desktop and mobile journey footage in [run 42427983542](https://github.com/my-edutu/Ai_games/actions/runs/42427983542) showed very sparse frames, not current PR #72 visual quality. The former 50ms presentation cap needed 13 visible frames to render a 620ms native sword phrase. The exact current-head three-job source-rig / desktop / 390px workflow remained queued with no inspectable artifacts. This is a measured source-clock mismatch and a **predicted** viewer defect, not a verified current-head film finding.

**Connected animation-only correction:** A pure bounded `planFullBodyVisibleFrameStep` now advances the original authentic *attack or cast* owner by at most 280ms for actually visible slow frames; the held recovery owner carries the same originally witnessed actionTick through one eligible idle server tick. `planImportedLivingSourceStep` supplies the Three.js source mixer with a matching bounded advancement, never faster than real visible time and only toward the actual action age; delayed first source frames retain anticipation. Native source-phase correction projects the full bounded source step instead of an assumed 50ms. Normal 60fps, reduced-motion, hidden-tab, actual HP-loss hurt, evasion, guard, locomotion, terminal death and unowned idle retain their previous budgets. No synthetic event, movement, damage, weapon detachment, new GLB/geometry, AI, camera, HUD, audio or particle code.

**Validation limitations:** An isolated Node harness reproduced 13 sparse-frame recovery and passed a four-visible-frame age/source sample, ordinary 60fps, first source anticipation, bounded forward-only sampling, abnormal input and inaccessible-mode guards. The new repository foundation regression checks source-living ownership and integration signatures. This is **not** a passed repository test suite, source-rig movement, GLB skin/weapon/deformation inspection, genuine five-stage desktop/390px WebM, 24×900 authority campaign, matched immutable `281735d0910c6b2443648af976003d50412ee324` comparison or independent visual critic. Accept only after exact-SHA Actions evidence and actual footage show improved contact, recovery and weapon/foot integrity. PR #72 remains DRAFT and unintegrated; other branches/main and global Gauntlet ledger remain untouched.

## 8 November — exact-source living one-shot double-clamp correction

**Confirmed source regression, not a current-head WebGL observation:** The preceding slow-frame change calculated a 280ms action increment for a true 1s render delay, then passed it into the generic advancePresentationActionAge utility, which re-clamped any delta to **50ms**. The actual a.visualActionAge therefore still needed 13 sampled frames to finish a 620ms attack. Exact-source isolated RED: requested 0.28s, accumulated only 0.05s. Genuine earlier Chromium recordings show severe delivery stalls, but there is still no current-head moving film to quantify the appearance.

**Scoped fix:** advanceFullBodyVisibleActionAge applies the already validated bounded original-rig attack/cast step once, maintaining a five-second age ceiling. The app uses it for legal attack/cast and unchanged hurt. Imported source AnimationMixer, recovery latch, hips, shoulder, weapon and cloth receive the intended actor age; no generated hit/target, authoritative damage, AI, material, geometry, camera, HUD, sound, particles or other session changes. Normal 60fps, reduced motion, hidden tabs and invalid inputs retain previous bounds.

**Verification:** Standalone exact-source RED/GREEN checks and a focused foundation regression cover repeated sparse frames, original cast/hurt isolation, accessibility, invalid input, 60fps pacing and the actual app integration. Full Node/24×900 and genuine desktop 1440px / mobile 390px original WebGL, natural entry→combat→Warden→floor→defeat/restart videos and independent skin/hand/sole/weapon critic are still pending CI, not claimed. The prior queued exact-head run will be superseded by the one new commit through workflow concurrency; do not misreport prior artifacts. Keep PR #72 draft, not integrated with PR #49, and no Gauntlet pass.

## 8 November 2026 — Session 03 original-source/overlay frame-budget repair

**Branch-only candidate, exact prior head:** `c5aba1e204de3e59a185e8c2f7174f64f88441c3`. Earlier genuine PR #49 1440px/390px recordings show severe delivered-frame starvation, but are **not** a current PR #72 A/B. Source diagnosis reproduced two independently checkable timing defects in the current native animation controller: at the second visible frame of a 1s gap the mixer could advance .28s while the owned pelvis/shoulder frame advanced only .23s more (giving the original weapon/feet a .05s lead), and when the source was already behind, the one-shot correction could add a further .125s phase seek to a .28s update, skipping .405s of original source keyframes in one sampled frame.

**Tests-first before/after scenario (pure source-clock, not WebGL):** licensed action event at visual age 0, native duration 1.042s, speed 1.68, 1s sparse rendered frames. Before: mixer progression .05, .33 versus owner .00, .28; under large lag, up to .405 source seconds in one frame. Proposed after: initial anticipation sample .05, then .28 and .56 at owner ages .28 and .56; extra seeking is permitted only within unused .28s visible-frame budget. Already-ahead source clips pause forward advancement rather than reverse; genuine HP-loss hurt, idle, reduced motion and hidden-tab fallback retain existing 50ms contracts. This affects only imported animation source timing and source/pose coupling; no authority event, rig geometry, weapon attachment, material, particle, sound or camera is touched.

**Verification integrity:** Test contracts were authored with the exact failing old formulas reproduced in isolation. Repository Node/browser/24x900 cannot be claimed until a runner executes them. The exact-SHA Actions workflow must provide current-head complete desktop/390px WebM and diagnostics (native clip/time, inverse-bind source-deformation, weapon-to-hand, world sole and actual defeat/restart). Previous PR #49 video is comparison context only; do not approve PR #49 integration or `TRANSFORMED_VERIFIED` without the independent LOOK/FEEL/PLAY gate. If the full-motion result shows skipped anticipation, weapon drift, bad skinning or leg slip, revert the bounded source-clock correction on Session 03 only. Keep the branch DRAFT; the Session 02 rig adapter contract remains unchanged.

## 8 November — original source GLB ankle-world trajectory evidence gate

Earlier genuine PR #49 desktop and mobile footage cannot prove planted soles, and current PR #72 still has no real exact-head moving WebGL artifact. Its small reversible ankle counterrotations are not a tested world-space IK solver. The source rig's original toe/sole floor geometry and clip root motion must be assessed before any high-risk IK change.

This branch adds a *demand-only*, read-only world trajectory measurement of the genuine imported left/right ankle joints versus the actor root, preserving source GLB instance UUID and footfall phase. A reconstructed GLB, missing foot joint, nonfinite pose or changed actor cannot silently become a zero-drift result. This is a measurement of **ankle joints**, never proof of actual sole mesh contact or fixed foot plants. No gameplay, authoritative movement, imported animation, mesh, material, camera, HUD or sound changes.

The 2 isolated Node source-helper tests passed locally. Focused repository tests, the native 24 x 900 deterministic authority campaign, 1440px desktop and 390px mobile moving recordings, genuine skin/grip/sole deformation and independent video critique still require exact-head GitHub Actions completion. Inspect the captured source trajectory with actual video before attempting constrained true-sole IK; roll back the demand-only inspector if its cost or fidelity is unacceptable. PR #49 and the global ledger remain off limits.

## 9 November 2026 — original-rig recovery cannot cross an authentic rendered teleport

**Test-first, scoped source-level defect (not a current-head film finding):** The live `app.js` sets `actor.locomotionTeleport` from `planExpeditionStep`, but the full-body source arbiter previously never received it. A witnessed legal adjacent attack at age 0.215s followed by the next genuine idle authority tick and a floor/root teleport still returned `mode: attack`, `holding: true`, the former contact target and the old attack tick. This could carry a sword swing toward a now-absent prior-floor victim, even though the native gait and ankle-support layer already stopped on teleport. The exact old controller reproduced this **RED** in an isolated source-function harness; prevalence in original footage is unverified.

**Conservative correction:** Pass the already computed visual `locomotionTeleport` through the existing model-assets-to-full-body-controller contract. A teleport clears the previous strike/cast visual recovery, prior contact ownership and false gait; an ordinary one-tick idle transition still completes lawful nonteleported source recovery. No simulation, floor transition, AI, target selection, damage, hit, sound, particle, camera, HUD, materials, geometry, skin weights, GLBs or other branch changed. A focused repository Node regression tests both sides and the live adapter signature. The isolated **GREEN** checks covered no held sword, no old target, tick ownership, normal recovery, no counterfeit stride and no resurrection after arrival.

**Release evidence still blocked:** Exact-head dedicated Actions source-rig/24×900/desktop 1440px/mobile 390px WebGL has not completed; the preceding run 42527739637 was queued with zero current-head artifacts before this change. The new commit must execute those jobs and produce original moving full-journey WebM before any independent visual quality verdict. Previous PR #49 recordings cannot validate this code. No inverse-bind/skin/sole/weapon-motion or five-stage A/B pass is asserted; PR #72 stays DRAFT and unintegrated. Roll back only this animation input guard if genuine transitions reveal a regression.

## 9 November — cancel old active source one-shots across a genuine visual root jump

**Confirmed code-level gap; new-head perceptual severity unmeasured:** The previous teleport guard stopped a retained attack/cast *idle recovery*, but an actor with the same public `attack`/`cast` label and unchanged source tick still satisfied `requestedOneShot` during a real `locomotionTeleport`. The next rendered frame could therefore replay that old sword/casting performance at the destination, contradicting physical source-pose ownership. The fix quarantines the original action tick through the relocation and landed frames, releasing it only for a newly witnessed authority tick. Real HP-loss hurt and HP-zero death remain higher priority; normal continuous lawful attacks are unaffected. This is presentation-only; no new movement, target, damage, particle, sound, skeleton or authoritative event.

**Floor precision:** A full `sceneChanged` floor switch already runs `clearWorld()` and reconstructs its actors, so an old GLB cannot physically survive that case. This new guard protects **retained** actor/source rigs during authentic *same-scene root jumps*; it does not invent a new floor transition or stair traversal.

**Evidence:** Added source-controller tests for both licensed action categories, teleport quarantine, landed same-tick suppression, lawful new-tick restart and verified injury/defeat dominance. The old predicate would select `attack`/`cast` on relocation, but full repository tests, 24×900 deterministic campaign and genuine 1440px/390px WebGL moving original-GLB footage are **not run/inspected** in this execution. GitHub Actions must validate the exact commit. Reject any deformation, grip, timing or restart regression; keep the PR draft and unintegrated pending independent visual review against immutable baseline `281735d0910c6b2443648af976003d50412ee324`.
