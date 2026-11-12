# D04 — Paired legacy versus opt-in renderer-cost trial (12 November 2026)

**IN PROGRESS / evidence-only diagnostic.** Not a combat realism acceptance pass, A/V synchronization proof, renderer optimization, production readiness result, or reason to enable D04 by default.

## Authority, branch, frozen baseline and observed defect

- Work only on `feat/dungeon-d04-combat-feedback-realism-20261108`; pre-change head `07837101ca8af198a64548534e3ad1fade39b01c`.
- Frozen BEFORE milestone remains `281735d0910c6b2443648af976003d50412ee324`. This milestone is historical; this test compares the **current same-branch legacy route** with opt-in D04 and does NOT claim equivalence to historical frozen visual/audio captures.
- Last authentic Chrome D04 recording: [Actions 43159247428](https://github.com/my-edutu/Ai_games/actions/runs/43159247428). An actual tick-4 HP loss missed its 400ms sound deadline after **1,765ms** observation-to-submission, including **1,596ms** separately measured inside WebGL render submission. D04's own effect-update phase rounded to 0ms. That is one concrete real-browser diagnosis, not an extrapolated distribution.
- The archived screenshot showed a readable real Warden warning, but still-image evidence is not moving combat. Previous combined WebM was sparse and decoded impact/onset alignment was not accepted.

## Test-first development and scoped implementation

- Red-first contract: `tests/foundation/dungeon-d04-render-cost-pair.test.cjs` and its isolated workflow entry. The red commit `503bfdb9407e06e3c39c176a527ed3d9c63bd657` failed [Actions 43166050871](https://github.com/my-edutu/Ai_games/actions/runs/43166050871) in the new contract because the implementation module was absent (`MODULE_NOT_FOUND`). Do not describe this as evidence of an in-game regression.
- `tests/browser/dungeon-d04-render-cost-pair.cjs` now rejects missing/negative/stale frame timings, synthetic sources, mismatched seed/checksum/run/floor/tick, viewport, camera, selected actor, FX route or non-software render mode. Its verdict can be `MATCHED_RENDER_DIAGNOSTIC_ONLY` or `INSUFFICIENT_MATCHED_RENDER_FRAMES`, never an invented performance improvement or causal GPU diagnosis.
- `tests/browser/dungeon-d04-real-render-pair.spec.cjs` uses **actual consecutive seeded DungeonRuntime snapshots**, one authentic HP-loss pair, and sequential fresh Chrome pages for legacy `/dungeon` then D04 `/dungeon?feedback=d04`. It samples the existing app's post-WebGL `directRenderMs`, actual draw-call count, WebGL frame serial and camera/scene metadata. No synthetic canvas, fabricated HP, extra GPU draws, fake time, audio audition, new browser debugger or screenshot-as-video substitution.
- It runs both at **1440×900** and **390×844**, using the existing tactical spectator view and identical frozen real post-injury snapshots. The test records raw samples and two still screenshots per viewport, but no moving combat clip or audio. Exact checksums and close camera positions are prerequisites for a matched cost figure. The test deliberately avoids parallel heavyweight GPU contexts and competing MediaRecorder streams.
- The comparison uses rank-ordered fresh samples from separate browser pages; it is observational, not randomized, GPU-fenced, or sample-synchronous. It cannot by itself demonstrate whether D04 caused WebGL stalls or audio lateness. If fewer than three pairs survive the strict filters, no p50/p95/p99/worst or overhead summary is published.
- The extra test also asserts legacy remains default, D04 requires the explicit query flag, no audio starts without a fresh user gesture, and D04's seven-pool/104-instance and seven-draw-call hard budgets are respected.

## Proportional validation

```sh
npm ci
node --test tests/foundation/dungeon-d04-render-cost-pair.test.cjs
node --test tests/foundation/dungeon-d04-*.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

The isolated Actions workflow includes its existing broader foundation contracts and genuine Chrome trial. **Do not mark new candidate green or any cost result verified without inspecting that exact workflow and its artifact**. A browser job may pass while matched performance remains `INSUFFICIENT`, because this evidence test refuses to manufacture comparability.

## Two reviews

**Specification:** Read-only tests and comparator only; gameplay authority, rig, lighting, camera source, renderer source, original sound synthesis and the normal spectator route are untouched. The 400ms limit, dedupe, consent, mute, accessibility and retained resource caps are unchanged. No write to main or Draft PR #49.

**Quality / performance:** Zero new production allocations, draw calls, audio nodes, effect scheduling or runtime overhead. Work is CI-only and may increase CI duration; the two serial pages and 26-second bounded evidence window per mode/viewport limit it. It is still vulnerable to variable software-WebGL runner thermal/load conditions and automatic camera settling, explicitly recorded as uncertainty. Screenshots are supporting stills; Playwright's video output without original opted-in sound is not accepted audiovisual footage.

## Rollback, acceptance and next owner task

Rollback only the new paired diagnostic foundation test, read-only comparator, new browser spec, isolated workflow lines and this document on the D04 branch. No production behavior is modified.

If matched browser timings consistently show a material D04-specific positive delta under equivalent scene/camera/FX, next profile **D04-owned retained visual geometry and effect overdraw** without removing real danger cues or increasing GPU budgets. If both legacy and D04 remain similarly stalled, report the bottleneck to the independent renderer owner instead of altering global lighting, resolution pipeline or camera in this session. No late sound, recovered fake hits, or deadline extensions.

Still unaccepted: authentic 3-direction moving desktop/mobile combat capture; complete Warden warning/release/recovery/counter/defeat; miss/block/dodge/projectile/spell comparisons; actual blade-tip geometry; decoded PCM sample onset alignment; 20-minute resource soak. The current D04 preview remains opt-in `?feedback=d04`.
