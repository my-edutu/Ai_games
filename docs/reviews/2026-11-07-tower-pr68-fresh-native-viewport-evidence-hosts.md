# Infinite Tower Climb PR68 — fresh per-viewport gameplay source and initial-episode integrity

2026-11-07 · **P0 OPEN** · leading transformation verdict **NOT EVALUATED**

## Verified root cause, not cosmetic gameplay work
The exact prior [P0 full-film review](2026-11-07-tower-pr68-executed-ci-and-unmatched-normal-speed-danger-film.md) inspected authentic original-host baseline and candidate WebM footage at [42382932723](https://github.com/my-edutu/Ai_games/actions/runs/42382932723). Its **portrait danger** browser source observations begin on DIFFERENT episodes: frozen baseline floor **8**, tick **467**; candidate floor **10**, tick **632**. Desktop began near floor 8, ticks **71** and **80**. Matching seed or video length could not fix this.

**Source-level cause located in workflow:** one `npx playwright test tests/browser/tower-live-motion.spec.cjs` invocation executed desktop and portrait serially with Playwright `workers: 1` and a **single config-scoped webServer** on port 4176. That server advances the actual original source at 20 Hz continuously. The portrait test therefore inherited a game that had already played through the desktop recording. The mismatch can invalidate guardian/crossing and portrait comparisons even though both real WebMs are long enough.

## One P0 evidence unblocking slice implemented
- `.github/workflows/tower-transformation-visual-evidence.yml`: **two separate Playwright CLI invocations** per baseline/candidate/scenario matrix job, one native 960x600 desktop and one native 390x844 portrait. Every invocation owns a fresh, unmodified source server and original seeded 20-Hz simulation. No accelerated time, synthetic image, replay insertion, source-file rewrite, baseline change or video splicing.
- `tests/browser/tower-live-motion.spec.cjs`: persist `motion.json.startScene` with the first genuinely observed source floor/tick/token/lifecycle, explicitly *not* a calibrated WebM time-zero. Gate after original video and sidecar preservation: source must begin on the intended launch floor and browser observation must occur no later than real source tick 250. A misframed clip is retained as failure evidence, never promoted.
- `scripts/tower-event-pairing.cjs`: compare the requested floor, valid early source tick/token and at-most-60-tick initial clock offset before event-name matching. The recorded clips remain **NOT EVALUATED** for visual similarity until independent full-motion event-aligned inspection.
- `tests/phase3/tower-event-pairing.test.cjs`: add specifically the previously observed floor-10/tick-632 late-portrait failure, start-clock divergence, and missing first-source-provenance fixtures; keep original integrity tests. New test execution is pending original GitHub runner.

Code implementation commits (same open **draft** PR68):
- [fdcf6dc0](https://github.com/my-edutu/Ai_games/commit/fdcf6dc02ac0646ca6491d52391357c09e19fb33) — fresh original source host per viewport
- [360fd6b6](https://github.com/my-edutu/Ai_games/commit/360fd6b62440752292fbb9f3e7b7a600a9585bc8) — original WebM and first observed scene preserved before start-quality veto
- [cf7ee540](https://github.com/my-edutu/Ai_games/commit/cf7ee540a34e5eb2fbc1e05dabfc99ff5dd72c9f) — source-start comparability audit
- [f812db1a](https://github.com/my-edutu/Ai_games/commit/f812db1a06c1ca2df2dbfb0ba8dd97d4a1bde4e2) — original-runtime regression fixtures

## Verified checks and unexecuted evidence
The [last *completed* pre-change exact-source quality workflow 42388132657](https://github.com/my-edutu/Ai_games/actions/runs/42388132657) at source `062d6162b4f08d38474594d0f830dbdfb327fb23` **succeeded**, including full repository logic, source witness, Tower self-test and desktop/phone browser HUD checks. **That pass does not validate today's harness edits, film, or game experience**.

After code implementation `f812db1a`, [exact-code quality 42390010700](https://github.com/my-edutu/Ai_games/actions/runs/42390010700) and [exact-code 9-job visual capture 42390010627](https://github.com/my-edutu/Ai_games/actions/runs/42390010627) were **queued** at inspection; there were no verified new video frames, original campaign artifacts or code-gate results from these jobs. The original old-WebM mismatch is an observed defect; whether the new capture implementation fixes it remains to be tested. No new live 3D gameplay mechanic or art was changed this run.

## Release gate and next highest-impact action
- **P0 OPEN**. Need exact-implementation test results, genuine new full-length desktop/portrait WebM and event-index sidecars for both immutable SHAs; confirm first source floor/ticks really align, then physically watch full-motion guardian/crusher, opened threshold, grounded floor-nine and outcome/restart. Source event name correspondence remains a locator, **not** frame-matched visual evidence.
- **Biggest visible unresolved weakness:** portrait hero/guardian/gateway scale and physical passage can leave frame; first repair what the new genuinely comparable footage demonstrates rather than speculative styling.
- Independent randomized fresh-context reviews: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Native device frame-time p50/p95/p99 and memory **NOT EVALUATED**. No claim of transformation acceptance.
- Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` preserved. PR58 untouched. PR68 remains **open/draft**. No merge, deploy, force-push or baseline move.
