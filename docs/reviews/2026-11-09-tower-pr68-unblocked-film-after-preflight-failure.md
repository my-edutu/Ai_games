# Tower PR68 — retain authentic native video after a preflight failure (2026-11-09)

**Active acceptance stage:** P0 EVIDENCE + GAME-LOOP TRUTH — OPEN  
**Leading transformation verdict:** NOT EVALUATED  
**Implementation commit:** [cb629b1e8573fe90e3be514dd5447e676e055b37](https://github.com/my-edutu/Ai_games/commit/cb629b1e8573fe90e3be514dd5447e676e055b37)  
**Inspected source before change:** 9ececaa14876ba6e7cf81dbcf4f49fe48db7bf8c  
**Frozen baseline:** 1731b380851162741761c5569e2bc152a0869ca9 — unchanged  
**Review PR:** https://github.com/my-edutu/Ai_games/pull/68 — OPEN DRAFT

## Actual defect and reason to repair this system, not score another test

The prior [nine-job original-source capture](https://github.com/my-edutu/Ai_games/actions/runs/42490211469) allocated runners, but eight baseline/candidate recording jobs stopped at scoped Node integrity preflight **before Chromium was installed or recording began**. The authentic source witness job succeeded; no fresh 60+ second candidate WebM emerged from those eight jobs. Earlier fixes addressed three preflight assertions, but any future scoped test failure would still cause all eight costly original-source jobs to miss their main purpose: recording actual game behavior for visual diagnosis. Successful preflight is a safety guardrail, not proof of visual quality.

At inspection, [new source-pinned nine-job recording 42593395530](https://github.com/my-edutu/Ai_games/actions/runs/42593395530) remained **queued**, all nine jobs unassigned and no artifacts; it is pinned to 9ececaa14876ba6e7cf81dbcf4f49fe48db7bf8c, which predates this implementation. [Quality run 42593395794](https://github.com/my-edutu/Ai_games/actions/runs/42593395794) for that same SHA was **cancelled** without execution. Neither can verify the new workflow changes at cb629b1e8573fe90e3be514dd5447e676e055b37.

## Coherent evidence-unblocking change

In `.github/workflows/tower-transformation-visual-evidence.yml`, the scoped integrity preflight now records its real step **outcome** and permits BOTH independent, original 20Hz source-host Chromium recordings to be attempted even if the preflight fails. The final mandatory capture veto now tests **all four real outcomes**: scoped preflight, desktop film, portrait film, native WebM audit. A preflight failure still **fails** the job; `continue-on-error` is collection-only, never approval. The artifact retains `scoped-preflight=...`, both viewport statuses and native audit status. Neither frozen baseline runtime nor candidate game code is substituted.

In `tests/phase3/tower-clockwork-guardian-sightlines.test.cjs`, a literal `\\n` sequence inside a JavaScript `//` comment swallowed the `const end` declaration in the original test helper. The executable declaration is restored on its own line; its existing actual-Three.js integration assertions are not weakened. This fixes a separate source-level reason why original quality verification could fail before meaningful feedback.

## Verification and strict limitations

- **Confirmed on GitHub:** implementation commit, exact text readback and unchanged baseline; no modifications to authoritative simulation, clockwork geometry, camera, Guardian, PR58 or main.
- **Workflow logical contract:** scoped preflight failure no longer prevents recording; final mandatory veto still checks the step `outcome` (not masked `conclusion`). This is a static-source check, **not** a successful CI recording.
- **Original Node 22/Three.js tests:** NOT EXECUTED at implementation SHA. Connected coding tunnel rejected commands with `Tunnel-client has not been seen for 300 seconds`; no working source checkout was available to execute the full original suite.
- **Source-pinned 60+ second original WebM:** NOT CAPTURED at implementation SHA. Candidate/source snapshot 9ececaa14876ba6e7cf81dbcf4f49fe48db7bf8c is still queued; no new current-source artifact.
- **20Hz two-campaign complete loop, native PTS, exact floor-nine crossing, actual outcome/restart:** NOT EVALUATED at new source.
- **Full-motion gameplay verdict:** NOT EVALUATED. Historical 390×844 original WebM from [run 42426089449, artifact 13594459833](https://github.com/my-edutu/Ai_games/actions/runs/42426089449/artifacts/13594459833) obscured the climber/guardian with foreground clockwork at ~16.5–18s; that old renderer footage cannot validate current fixes.
- **Independent randomised blind critics:** LOOKS 0/5; FEELS 0/5; PLAYS 0/5. **Target device** p50/p95/p99 and memory: NOT EVALUATED.

## Next highest-impact action

Monitor already queued 42593395530 for its original live evidence and source witness rather than misreporting it as evaluated or piling up duplicate nine-job runs. Once a runner is available, run current exact-head Node/Three tests; request NEW baseline/candidate capture pinned to the latest implementation SHA to exercise the fail-but-film workflow, then review 960×600 and 390×844 unedited WebM end-to-end against native event sidecars. Inspect actual moving deck, guardian/crusher victory, physical gateway walk, floor nine, outcome/restart. Reopen the **largest current footage-proven gameplay/visual defect** and implement its connected 3D correction, rather than escalating to P1 on CI alone.

**Safety:** `transformation.json.baseline.sha` stays 1731b380851162741761c5569e2bc152a0869ca9; PR58/main untouched, PR68 remains draft and open. No merge, deploy or force-push. The initiative stays OPEN.
