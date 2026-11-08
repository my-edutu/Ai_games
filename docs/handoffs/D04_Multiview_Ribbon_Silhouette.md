# D04 — restrained blade-streak visibility across orthogonal viewpoints

**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108` (isolated). Starting head: `6599c1b59e57aff862d76c2a3c8455627d36ff03`. Frozen comparison BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

**Acceptance state: source-level geometry improvement only. Genuine Dungeon gameplay A/V remains UNVERIFIED.**

## Evidence-led defect and test-first contract

The D04 skinned-wrist streak is one flat tapered XY ribbon. When observed along its local X axis, its projected YZ area is **zero**, so side-angle gameplay can lose the stroke entirely even when the real wrist motion is accepted. This does not establish that any actual recorded camera angle displayed the fault: the original GLBs and genuine in-motion capture are still unavailable.

A new focused regression contract (`tests/foundation/dungeon-d04-multiview-trail-geometry.test.cjs`) was committed *before* the implementation. A detached reproduction of the original geometry and candidate showed this orthogonal-view failure and its correction:

| Geometric probe | Single-plane BEFORE | Crossed-face candidate |
| --- | ---: | ---: |
| XY projected triangle area | 0.03603 | 0.02713 |
| YZ projected triangle area | **0.00000** | 0.02713 |
| 45-degree oblique projected area | 0.02548 | 0.03837 |
| Vertices / triangles | 34 / 32 | 68 / 64 |

Areas are ideal geometric projections of a *standalone procedural mesh*, **not** screen-space visibility, game screenshots, frame timing, rendered pixels, audio onset, or measured fidelity. The committed native Node test has not run inside the complete repository. A detached Node test executed on an exact standalone copy of the changed geometry function: **1/1 passed**; syntax check also passed. The coding tunnel was unavailable, so the full browser chain, assets, suite and CI remain unverified.

## Narrow production edit

`public/ai-dungeon/physical-feedback-visuals.js`: the original thin taper is now two perpendicular narrow faces in the **same BufferGeometry**, sharing a single `trail` InstancedMesh, geometry allocation, material and draw call. Each face uses 19mm central lateral extent (previous single face 27mm), with the same 3mm endpoints and 16 longitudinal segments. Transform, measured-wrist provenance, 0.9m/s speed filter, event attribution, pool allocation, cleanup and all sound gates are untouched.

This reduces complete edge-on disappearance from orthogonal viewpoints, but is not a physical sword model. Depending on transparency sorting and camera angle, the intersecting faces may overlap and appear brighter; evaluate against genuine moving footage, including 390px mobile, before accepting.

The seven retained VFX pools, 102 reserved instances, maximum seven VFX draw calls and eight-voice original foley limit are unchanged. Extra vertices are 34 and extra triangles are 32 in **one already-retained mesh**. No per-frame geometry creation, new lights, textures, independent actors, source samples, new audio output, modified rigs, or authoritative events. Reduced-motion remains suppressed; reduced-flash material opacity and the D04 real WebGL submission gate remain unchanged.

## Mandatory genuine verification outstanding

The actual pinned GLB/texture binaries, authentic three-viewpoint BEFORE/AFTER desktop and 390px mobile playback, captured WebGL plus original WebAudio PCM, Warden warning/release/recovery/earned-counter, sword miss and HP-confirmed contact, blocks, dodges, projectile/spell clearance, high-density lifecycle and 20-minute soak remain **NOT RUN / UNVERIFIED**. The legacy spectator is still the default; opt-in remains `?feedback=d04`, with no integration into main or Draft PR #49.

**Spec review:** no change to authoritative causality or any sound, timing, rig and camera ownership. **Quality review:** orthogonal procedural silhouette is fixed at the geometry level, but in-game overdraw and distance readability are unresolved. Rollback is limited to the visual-source commit (and its corresponding geometry test) on this D04 branch.

**Next dominant weakness:** identify the actual sword blade-tip/weapon transform in the licensed original GLBs and compare real hand/weapon dynamics to matched A/V. Until then, wrist-motion streak geometry is a presentation proxy, not demonstrated physical blade contact or Diablo IV parity.
