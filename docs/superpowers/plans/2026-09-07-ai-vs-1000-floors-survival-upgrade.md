# AI vs 1,000 Floors — Cinematic Survival Upgrade Plan

## Scope
Upgrade Game 4 from its current tactical Canvas broadcast into a game-first, sector-distinct survival presentation while preserving authoritative rules, deterministic generation/replays, privacy-safe browser state, recovery behavior, autonomous streaming, and low-end support.

Baseline source: `agent/game-4-ai-vs-1000-floors-r4` at `5e7132dbf7c9f381ef7e06aebb394ce2d5821352`.
Working branch: `agent/game-4-cinematic-survival-upgrade`.

## Verified baseline
- `r4` is 26 commits ahead of `main` and 0 behind.
- Existing CI run #1160 failed at `npm test`: 407/411 tests passed.
- Four pre-existing failures: three foundation safe/zero-enemy/full-ascent expectations and one Phase 5 corrupt-newest-snapshot restore expectation.
- Because `npm test` failed, stream self-tests, chaos/release evidence, Chromium install, browser capture, and later artifact generation did not run.
- The brief's recorded `npm run verify:floors:software` command does not exist in the current `package.json`.

## Source-of-truth findings
- Game 4 is a discrete grid tactics/survival ascent, not Infinite Tower Climb and not a continuous-physics platformer.
- Authoritative player actions are move / attack / guard / wait.
- The live sector catalogue is: Intake Vaults, Pressure Works, Relay Gardens, Glass Circuit, Null Foundry, Storm Archive, Warden Lattice, Black Reservoir, Crown Engine, Architect's Spine.
- Browser rendering currently receives a bounded sanitized snapshot and polls every 700 ms.
- Current Canvas presentation is generic: flat tiles, a diamond Astra, triangle enemies, generic hazard marks, fixed palette, minimal sound, dashboard-heavy three-column shell.
- `presentationVersion` and capabilities in the manifest are stale relative to the Phase 3 implementation.

## Non-negotiable architecture
1. Keep the authoritative simulation and deterministic version unchanged for the presentation upgrade.
2. Do not change legal actions, floor generation, hazard activation, combat, progression, save schema, replay semantics, or audience command paths in this change set.
3. Add only public-safe derived presentation semantics to the render snapshot.
4. Interpolation, camera motion, particles, lighting, materials, and audio remain browser-only cosmetics.
5. Quality presets may alter cosmetic density, DPR, secondary animation, shadows, and particles only; simulation outcomes must be identical.
6. Do not expose run IDs, seeds, RNG state, provider/operator data, queued influence commands, storage paths, or credentials.

## Implementation sequence

### Task 1 — Presentation-contract tests first
Extend Game 4 Phase 3 tests before production code so they fail for the missing revision-3 contract:
- sector identity/name/tone in sanitized snapshot;
- hazard presentation state derived from real period/phase/tick timing;
- bounded public state remains private;
- browser revision 3, quality control, game-first stage, spectator-safe details, reduced motion;
- manifest presentation version/capabilities no longer claim presentation is unimplemented.

### Task 2 — Public presentation semantics
Update `src/presentation/snapshot.ts` to derive:
- code-backed sector id/name/tone;
- hazard telegraph label, cycle period, ticks-until-active, and active-next-step state using the same authoritative timing rule;
- compact enemy/state cues without leaking simulation internals;
- clearer semantic event copy for supported actions/milestones.

No authoritative state mutation.

### Task 3 — Game-first browser shell
Rework `public/ai-vs-1000-floors/index.html` and `styles.css`:
- stage owns the overwhelming majority of viewport;
- compact top HUD for floor/sector/objective/vitals/danger;
- contextual AI decision card and event caption over the stage;
- secondary run/build/history telemetry moved to an on-demand details drawer;
- responsive landscape layout, keyboard focus, contrast, reduced-motion and reduced-flash behavior retained;
- spectator mode remains free of operator diagnostics.

### Task 4 — Constructed 2.5D Canvas renderer
Rebuild `app.js` around reusable low-cost drawing primitives:
- ten sector-specific material/architectural treatments derived from the actual catalogue;
- wall thickness, structural edge depth, floor seams, contact shadows and restrained environmental motifs;
- interpolated Astra movement between authoritative cells; orientation and action silhouette derived from real movement/intent;
- distinct enemy silhouettes and telegraphs by actual kind/state;
- hazard shapes/animation driven by real hazard cycle semantics;
- exit/reward/route emphasis without implying unsupported collision or cover;
- event-aware but bounded camera framing that never obscures threats;
- Low/Balanced/High/Ultra presentation presets with DPR/effect budgets and automatic safe default;
- cosmetic randomness derived locally from stable visible identifiers only and never fed back into authority.

### Task 5 — Semantic audio and feedback
Expand Web Audio without external/licensing risk:
- bounded voice pool/cooldowns;
- movement/contact, hazard warning, danger, damage, enemy defeat, floor clear, sector milestone and result cues;
- critical captions remain visual equivalents;
- audio unlock remains user initiated;
- reduced-motion/flash remain independent controls.

### Task 6 — Browser evidence and regression coverage
Extend `tests/browser/floors-stream.spec.cjs` to verify:
- desktop stage dominance and no overflow;
- phone landscape readability;
- quality preset switching without changing authoritative state fields/outcomes;
- details drawer keyboard behavior;
- reduced-motion truthfulness;
- screenshots for desktop, low-quality, phone-landscape and reduced-motion.

### Task 7 — Verification surface
Add a current `verify:floors:software` script that composes the existing Game 4 phase tests, stream self-test, chaos/release validation and browser test command rather than referring to a nonexistent verifier. Do not weaken existing global CI.

### Task 8 — Baseline debt review
After the presentation regression is green relative to its new tests, separately root-cause the four pre-existing baseline failures. Fix only if the intended contract can be proven from current code/specification; never change an assertion merely to make CI green. Any authoritative fix gets its own test-first commit and deterministic-compatibility review.

## Verification / evidence standard
- Observe new presentation tests fail before implementation, then pass after implementation.
- Compare branch CI failures against the four known baseline failures.
- If baseline debt is repaired, require the full CI workflow to reach stream self-tests, browser capture, artifact generation, and release validation.
- Inspect generated screenshots rather than treating test success as visual approval.
- Report CI/Playwright timing only as CI-machine evidence; do not claim real-device 30/60 FPS without hardware measurement.
- Never claim 72-hour endurance, live-provider validation, canary status, independent review, or production-ready status without that evidence.
