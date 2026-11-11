# Tower PR68 — P0 exact source-to-submitted visual-phase cohesion (2026-11-11)

**Acceptance remains NOT EVALUATED.** Immutable frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` unchanged. PR #68 remains draft on `feat/tower-transformation-gauntlet-20261101`; PR #58, other games, deploy and main are excluded.

## Source-observed problem and scope

Original matched candidate/frozen baseline film run [43091649344](https://github.com/my-edutu/Ai_games/actions/runs/43091649344) produced all eight normal-speed WebMs and causal source stories, but strict event-visible guardian comparison failed **0/2**. Original candidate portrait guardian staging remained visibly obstructed and the native Floor 9 HUD/world drawing occurred roughly two seconds later than source timecode search. A 2s discrepancy is NOT yet attributed to CPU, fetch, WebGL, compositor, recorder or timebase calibration; previous quality run was a safety veto only.

Source inspection shows `app.js` previously called `view.accept(data)` and `hud.update(data)` immediately on HTTP. `scene.mjs` actually submits that accepted snapshot only in a later `requestAnimationFrame`. When a new Floor 9 state arrives before an overloaded Three.js frame, the HUD could advertise the new floor while the canvas still shows the older physical tower. The correction creates an immutable **one-slot original-frame identity latch**: normal HUD floor/phase/height advance only after the **exact accepted snapshot object** returns from the original WebGL submission; skipped source snapshots never falsely report rendered frames. This does NOT pause fixed-step gameplay, retime video, alter guardian mechanics, create outcomes or claim GPU completion. Real result, intermission, upgrade, recovery and WebGL failure remain source-accessible even without a 3D frame. Renderer/UI callback faults stay isolated and logged.

The bridge is limited to `app.js`, `scene.mjs`, `visuals/presented-phase-latch.mjs` and focused Node tests. Test-first contracts cover stale/clone submissions, burst skipped frames, source-only terminal and later restart. Local Node 22 focused **3/3 pass** after confirmed pre-implementation missing-module failure. External exact-head CI and full-motion visual acceptance remain pending due queue.

## Real CI/capture runner blocker, not falsely graded

At inspection [43098259133](https://github.com/my-edutu/Ai_games/actions/runs/43098259133) and [43098259243](https://github.com/my-edutu/Ai_games/actions/runs/43098259243) had been **queued for over two hours** with **zero admitted jobs/artifacts**. Seven preceding quality submissions were also queued; no genuine after-film inspection is possible yet. The evidence request is amended for a new immutable `github.sha`, but it is only a request, not completed media. No claim that this latch resolves the existing ~2s source-to-native-pixel mismatch or physically unblocks a guardian sightline.

**Next:** accept runner admission, validate exact source/head checks, inspect 8 original baseline/candidate films and native PTS against source accepted/renderer returned/actual pixels; prioritize any unresolved large guardian obstruction, grounded gate crossing, genuine Floor 9 continuation and restart. Independent **LOOKS 0/5; FEELS 0/5; PLAYS 0/5**, physical supported device p50/p95/p99/memory **NOT EVALUATED**.

## Source-pinned CI/capture admission after game commit

Play code and capture request committed together as [cfaa82f92bfe834a48f9ce168e97a1b353c9b6b6](https://github.com/my-edutu/Ai_games/commit/cfaa82f92bfe834a48f9ce168e97a1b353c9b6b6). At follow-up inspection, GitHub admitted the full nine original recording jobs at [capture 43108948655](https://github.com/my-edutu/Ai_games/actions/runs/43108948655), and exact-head [quality 43108948807](https://github.com/my-edutu/Ai_games/actions/runs/43108948807) was running. Neither is evidence of a pass until completed and inspected. Old queued jobs remain distinct and do not prove the new build.
