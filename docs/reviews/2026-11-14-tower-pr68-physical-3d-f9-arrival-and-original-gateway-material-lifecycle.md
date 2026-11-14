# PR68 — P0: authentic 3D Floor9 arrival and original gateway material lifetime (2026-11-14)

## Scope / immutable controls

- PR: https://github.com/my-edutu/Ai_games/pull/68 (remain **open draft**, based on active PR58). This is **P0 OPEN**, not an acceptance/score.
- Frozen transformation baseline SHA: `1731b380851162741761c5569e2bc152a0869ca9` (unchanged).
- Inspected branch head before edits: `f3972261216aeb442f6b9a509c06fd651efde1ce`.
- Source changes only to `public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs`, `world.mjs`, and a tower-only test. No gameplay/authority, physics, PR58, other games, merge, deploy, branch rewrite or draft-status edits.

## Most important *actual* previous footage defect

The original source-pinned desktop 960x600 and portrait 390x844 danger WebMs still show a bronze Floor8 -> abruptly violet Floor9 transition at about 24–27 seconds, without a demonstrably continuous full-body walk through the original bronze portal. **Strict source-event/native-frame acceptance remains 0/2.** The previous [nine-job capture](https://github.com/my-edutu/Ai_games/actions/runs/43528848194) produced downloadable original video artifacts but its evidence status failed: candidate preflight (older source fda30ca) rejected a then-unfixed timebase test assertion; source/native event pairing was also vetoed. Video exports are not an approval.

The [previous exact-head quality run](https://github.com/my-edutu/Ai_games/actions/runs/43528897452) passed 9/10 jobs and failed Phase6 on the **unrelated maze-readiness-score.test.cjs** after timeout exit 124. This is a whole-repository CI veto, not permission to modify Maze or mark Tower green.

## Primary code-level/system gap identified

The old authentic source-Floor9 arrival material system calculated the bronze-to-void progress from **horizontal source X alone**:
`smooth((player.x-crossingX-6000)/84000)`. The real source design permits a very short remaining grounded runway after the physical cap threshold, and then a genuine onward climb. In a physically representative tower test, the reachable grounded X length beyond the recorded crossing is only 15,400 source units (~1.54 m). The horizontal-only 90,000-unit (~9 m) complete transition was therefore unreachable before the real actor ascended. The sky, distant atmosphere and Floor9 ground could continue looking like the old biome until source eligibility expired, then abruptly switch. A passing source validator does **not** fix that visual continuity defect.

The already-rendered original bronze gateway also had a different material lifecycle from the old deck and selected original clockwork structural triangles: deck/gallery faded by actual returned Three.js frames, while the authentic gateway could stay opaque until the entire original GPU group was removed. This risks a visible portal pop precisely when the actor traverses the threshold.

## Substantive implementation

1. `e3bd9b85bf9aab39adf18148e9fb8a09024ca740` — committed tower-only **test-first contracts**: measured horizontal source movement held constant while the actual authoritative body climbs 5 m and then 10 m; the same old/new spatial palette must advance. Added no-false-source and successful-WebGL-submission material-retirement contracts.
2. `1318e0512743d3b0242b71d98c8e1b9ccfab36eb` — production palette now derives progress from `Math.hypot(actual horizontal delta, actual feet height above original roof)`, not a fictitious horizontal runway. Existing immutable defeated-guardian, original cap, roof parity, source tick, grounded/airborne support and next-floor source rules remain. Existing material consumers in World and Scene use this same genuine 3D spatial proof; it changes no position, jump or collider.
3. `99c43a70266513a129fa9ee11fafe1ab46e10ee2` — World now owns cloned materials for the **same existing GPU original bronze guardian doorway**, with one clone per distinct original material, tracked by retained-cap disposal. All previously authored cap/gallery meshes keep their real geometry, source-aligned transforms and cleanup. The gate and old roof/gallery share a source-dependent retirement: the original arch stays solid until *real whole-body clearance or real upward ascent*, and then fades only as both immutable source departure and successful renderer-submitted frames establish motion. Never fade shared old-floor gameplay metal, fake a passage or retire an unseen render. This is not an additional arch or platform.

## Evidence and non-claims

- The new regression contract requires an authentic F9 climber with almost no horizontal travel to reveal next biome while rising, and requires no premature gateway disappearance on unseen WebGL frames.
- Existing low/high tier camera, source publisher, gameplay FPS/physics, opponent, progression and restart were not changed.
- Only source reading, static code-contract authoring, original prior-film findings, and safe non-force GitHub commits are confirmed as of this document. Fresh **exact-head green CI, 60+ second original desktop/portrait candidate footage, matched native event/pixel timing, hardware p50/p95/p99/memory and independent panel acceptance** remain unverified.
- P6 critics: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Verdict **NOT EVALUATED**.

## Next strongest action (remain P0)

Run the existing nine-job immutable-source baseline/candidate capture at seed `tower-transformation-capture-v1`, low tier, desktop 960x600 and portrait 390x844, 60+ seconds in ascent, moving-platform, danger/guardian and outcome/restart scenes. For original danger WebMs, inspect *unaltered* 22–31 second footage at 1x, compare authentic source guardian HP zero (previous tick 441), real original crossing (451), actual player feet and ascending body, original gateway material opacity, returned Three renderer clock, camera, F9 roof/sky/material progress and native frame timestamps. Reject if the bronze gateway disappears abruptly, actor never visibly passes it, or event/frame timing mismatches. Also investigate whole-repo Phase6 timeout without modifying unrelated game code. If physical through-the-door continuity still fails, P0 priority is a measured source-owned shared-world/camera architectural reconstruction, not more unverified fades.

**Do not close P0 or advance to blind acceptance until the same live scene demonstrably passes.**