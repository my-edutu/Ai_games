# Marble racer studio and spectator hierarchy

> Execute inline with TDD. The approved requirement is the user's Game 7 Gauntlet prompt; do not claim independent review or commercial parity.

**Goal:** make the existing 32 public competitors inspectable as real original 3D characters, and free the race view of persistent dashboard clutter.
**Architecture:** additive read-only studio consuming `window.marbleRenderFrame.snapshot`, separate from the authoritative renderer and rules; original WebGL2 portrait materials/geometry, no external assets or dependencies. Game-first CSS keeps existing accessibility controls and selectors. No fake 3D when WebGL is unavailable.
**Constraints:** preserve physics/RNG/outcomes and all other games; keep existing quality/performance gates; bounded resources and zero studio animation when closed; prefer reduced motion; no background authority requests. Current source tree verified against GitHub `7ce6430402139cb6d369d82cb1dec0c8ad749ee2`.

## Tasks
- [x] Test pure model/mesh/identity behavior RED; implement GREEN. Cover all 32 identities, 4 roles, invalid input, bounded mesh allocation, non-mutation.
- [x] Add lazy GPU renderer and accessible studio dialog: full roster, keyed buttons, real public stats, selected identity, modal focus/Escape, contextual fallback. Test with actual Chromium in CI.
- [x] Compact header/standings/event overlays, preserving cinematic/clean feed and expanded mobile standings. Add layout regression assertions, inspect screenshots rather than assuming CSS success.
- [ ] Run Marble and catalogue checks; capture live desktop/mobile/studio frames in GitHub Actions; self-review, fix observed gaps, update progress with exact evidence and unresolved gates.

## Review focus
Empty/stale renderer data must never make up competitors. Missing/invalid public fields must not inject markup. Opening and closing studio must not leak GPU contexts/RAF loops. Resizing and reduced motion must not obscure controls. UI-only inspection must never call the operator or influence API.

## Evidence limitations
Local TypeScript 5.8.3 is available. Offline npm cache lacks locked packages. Local Chromium cannot create a WebGL2 context and blocks localhost navigation; do not weaken browser settings. Local pure tests and offline CSS checks are distinct from live CI/WebGL evidence. No subagent/ultracode executor is available in this session; final review is author self-review.

## Current checkpoint
Implementation and initial native desktop/mobile checks are complete. The local follow-up corrections pass 159 foundation cases and DOM regressions; expanded recovery/video checks in run 41167731966 remain queued. Run 41166953232 verified 159 Marble / 662 catalogue tests and both initial studio checks; the pre-existing race frame-time gate still fails at 250ms p95. Final review is author self-review, no commercial win. Ruling: use an additive read-only studio instead of replacing the authoritative race renderer; cost: studio detail does not imply in-race art parity. Deferred: main camera/lighting and a controlled GPU performance investigation.
