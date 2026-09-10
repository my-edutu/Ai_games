# Marble Survival Tournament

An autonomous five-round Canvas/browser-source tournament using the same deterministic `MarbleRuntime` as headless execution. The standard bracket is **32 → 16 → 8 → 4 → 2 → 1**.

## Current status — upgrade in progress

The runtime, HTTP participation, snapshot-isolation and viewport-hardening work has fresh software evidence. **The complete premium upgrade is not release-ready:** default tournaments are too short, and every championship in the latest 32-seed corpus used the generator fallback. These are gameplay blockers, not external certification paperwork.

The visual direction remains Precision Miniature Motorsport: warm ivory surfaces, charcoal structure, restrained metal hardware, numbered/patterned marbles and a compact spectator HUD. The current view is a Canvas prototype, not a certified ultra-realistic or 4K/60 FPS result.

## Implemented foundations

- `marble-physics-v2` authority shared by browser/OBS and headless execution; fixed logical ticks, independent of rendering quality.
- Explicit same-tick crossing order; stable ID is the final exact-tie policy. Simultaneous elimination and invalid-final cases have regression coverage.
- Translating sweepers share public/physics transform data and transfer relative momentum.
- Public snapshots, semantic camera directives and bounded presentation replay copies.
- Low, Balanced, High and Ultra presentation presets; procedural six-voice Web Audio cues.
- One operational wind influence family; five other catalogue families explicitly fail closed.
- Signed HTTP-only participation sessions, server reception clock, run/round-bound commands, one pending/active field, logical cooldown, final-round exclusion and Assisted records.
- Snapshot capture/restore copy isolation, JSON-safe checksums, configuration/set/influence validation, and an explicit `wind-policy-v2` compatibility boundary.
- Public event field allowlists; no known default operator credential; loopback CLI bind unless explicitly overridden.
- Fixed desktop/landscape/clean-feed viewport layout and intentional portrait scrolling.

## Verified revision and limits

Implementation commit: **`7de7b565657d8bb7137e20401f1f9ce1158b2bdb`**. GitHub Actions run **69 / 34464582959** passed build, Game 7 tests, HTTP self-test, nondeterminism scan, dependency audits, six browser captures and authority performance checks. The local focused suite passed **62/62 tests**, including 17 newly observed red-to-green hardening regressions. CI artifact **10146984794** includes exact source revision, screenshots and machine-readable results.

Browser scenarios: 1920×1080 Balanced, 1920×1080 Assisted wind, 1366×768 Low, 844×390 Low, 390×844 portrait/reduced-motion setting and 1920×1080 clean feed. Desktop/landscape/clean-feed arena and public HUD bounds pass; portrait scrolls intentionally. All six report zero browser errors. Screenshots do not prove full accessibility, ten-second comprehension or OBS compression readability.

On the CI AMD EPYC 7763 / Node v22.23.2 host, ordinary authority tick p99 was **0.5495 ms**, and the forced 32-marble contact fixture p99 was **1.1966 ms**, below the 8 ms budget. These short CPU tests are not browser/GPU frame-rate or long-running memory evidence.

A separate local 32-seed production-rules campaign produced 32 valid champions, exact brackets and matching twin replays, with 160 round-boundary JSON restores. Sixteen cases applied one wind command exactly once. However, tournament duration was only **10.18–12.32 seconds**, and **32/32 final arenas used fallback**. The whole-catalogue `npm test` attempt did not finish within the local execution budget; no whole-repository pass or merge-readiness claim is made.

Detailed review: `docs/reviews/2026-09-10-game7-hardening.md`.

## Commands

```bash
npm ci
npm run marble:upgrade:test
npm run marble:stream:self-test
npm run marble:stream
node games/marble-survival/scripts/profile-premium-runtime.cjs --enforce
node games/marble-survival/scripts/capture-premium-runtime.cjs
```

The standalone host defaults to `127.0.0.1:4317`. Configure `GAME7_OPERATOR_TOKEN` explicitly to enable operator controls. Set `HOST` deliberately only behind an appropriately configured deployment boundary. No production deployment is implied by these commands.

Presentation routes: `/`, `/?quality=low`, `/?quality=high`, `/?quality=ultra`, `/?clean=1`.

## Snapshot compatibility

Snapshots require both `marble-physics-v2` and `wind-policy-v2`. Earlier snapshots lacking the input-policy version are rejected. Start a fresh tournament when crossing this policy boundary; do not silently resume old in-flight commands.

## Module boundaries

`src/runtime`, `src/physics`, `src/rules`, `src/generation` and `src/influence` own authoritative behavior. `src/presentation` derives public copies; `src/persistence` validates snapshot round trips. The Node host normalizes HTTP inputs. Browser drawing, camera, audio and replay never own winners.

## Remaining work

Repair pacing and systematic championship fallback first. Then complete the intended AI, influence-family, replay/camera, mobile-legibility and material/feedback requirements. Durable host recovery, production ingress/provider operations, independent reviews, 72-hour soak, seven-day canary and representative low-end/OBS performance remain open. **R5 / unattended production-ready is not approved.**
