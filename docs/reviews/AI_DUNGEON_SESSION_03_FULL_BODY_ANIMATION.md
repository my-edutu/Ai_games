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
