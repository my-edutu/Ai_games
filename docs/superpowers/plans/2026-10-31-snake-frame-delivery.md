# Snake frame delivery implementation plan

**Spec:** `docs/superpowers/specs/2026-10-30-autonomous-snake-3d-gauntlet.md`.

**Goal:** Improve truthful frame delivery and visible character/environment quality without weakening the existing browser gate or changing deterministic authority.

**Execution:** Inline while the shared workspace/agent tunnel is offline; no independent-review claim.

## Constraints

Preserve rules, snapshot schema, AI, scoring, all semantic cues, portal discontinuities, reduced motion, captions, recovery and bounded resources. Keep the 17 actual-draw threshold and existing gap checks. Diagnostic ablations never satisfy acceptance. Do not merge or deploy.

## Progress

- [x] Restore exact source and locked dependencies into an isolated scratch checkout and verify archive hashes.
- [x] Establish focused baseline; diagnose page composition with controlled source/CSS ablations. Reject inconsistent layout changes and larger queue experiments rather than claiming speedups.
- [x] Reproduce 50 identical-frame HUD mutations in 650 ms, remove redundant writes, preserve same-revision captions and recovery, publish `3f23e6`.
- [x] Verify HUD CI: both new tests pass; 14/15 focused browser tests pass. Desktop 10 draws per sample still fails unchanged requirement.
- [x] Reproduce body/tail hover, fix grounded geometry, verify poses, portal caps and fixed resources.
- [x] Fill distant empty horizons using bounded shared geometry; reject floating-looking first candidate; verify unchanged court/coping vertices and actual captures.
- [x] Reproduce unnecessary phase-only instance uploads; separate trap visuals from stable topology; cache portals/obstacles with explicit invalidation and pixel-restoration checks.
- [x] Run fresh full Node suite: 539/539 pass; focused Snake suite: 36/36 pass.
- [ ] Read exact-head live CI after publication, inspect retained real output, and preserve any failed gates explicitly.
- [ ] Obtain independent whole-game visual/motion review; current worker connection is offline.

## Environment rulings

Recovered source was synthetic merge `db5707062753c1acadac84efa3a1327d6e6b68a4` (feature `73d885d` plus main `d1678cd`); only the reproduction workflow changed after `c086716`. No credentials or working state were bundled. Local Chromium 144 needs Xvfb for WebGL. Local HTTP navigation is administratively blocked: do not change that policy. Local diagnostics import source modules through Blob URLs and inject retained public fixtures; CI Chromium 140 is the live-host integration gate. Neither environment substitutes for sustained real-device validation.
