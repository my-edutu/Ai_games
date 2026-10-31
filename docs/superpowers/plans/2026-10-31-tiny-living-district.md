# Tiny Kingdom living-district continuation

Goal: improve the existing running game, not a mock-up; expose characters for scrutiny, replace toy-like tree shapes with layered foliage, and eliminate repeated rigid-character mesh generation without changing simulation.
Base: remote 6a1ed848; HTML SHA256 b729a47541cf68509420bb685a9bdff4045f5a4461767d80f42b90a2d194d4e5.
Approved direction: user's continuing Pagonia Gauntlet; current character, district and performance gaps. No merge or claim of reference victory.

## Tasks
1. Add tests that fail for missing bounded character-mesh reuse and an unobstructed close-up inspection camera. Benchmark the actual current mesh-generation path. Cache only immutable head/accessory meshes; keep legs, wrists, tools and work poses live. Test replay invariance, restored/new citizens and cache bounds.
2. Add tests for layered conifer/broadleaf geometry and clustered understory. Replace solid stacked cones; add groundcover near existing trees, not new solid navigation obstacles. Keep seasonal static caching, original assets and bounded meshes. Capture fixed market/forest scenes and seasonal geometry audits.
3. Add a real selected-citizen close-up control and restore overview safely. Test mobile/keyboard, invalid inputs and camera visibility. Capture all six professions and continuous autonomous movement, plus matched before/after and a timed CPU comparison.
4. Verify focused and existing tests; publish to the existing draft only via expected-head check; run GPU/complete suite in CI; inspect actual captures; record exact pass/fail, renderer and review boundaries on a separate progress page.

## Constraints / review focus
- seeded-work-v2 snapshots, RNG, navigation and economics unchanged.
- No generated promotional image, no copied commercial assets, no fabricated FPS or independent critic.
- Static landscape does not introduce invisible collisions; bounded presentation caches and valid outward normals.
- Close camera must not place the eye in a building or change authoritative citizen positions.
- Compare the same source/camera/time/workload; software WebGL is not hardware performance.
- Self-review is explicitly weaker than independent review; worker status call returned disconnected.

## Ledger
Baseline focused run:19/22; three WebGL-only checks failed because local Chromium could not create a WebGL context, reproducing with an empty canvas. Resolved by supplying a virtual X display to the software driver; no product test weakened.
Task1: bounded character reuse and inspection implemented; missing-API tests observed red then green.
Task2: rejected over-budget solid foliage; replaced with original alpha-tested leaf cards and matching shadows, keeping the existing static mesh budget. Branch/understory and paused-buffer tests green.
Task3: corrected facial normal seams, mobile body occlusion and reset/restore portrait state; each reproduced by a failing test first. Added safe next/return controls and rooftop dormers.
Task4 local verification:35/35 focused tests, TypeScript build and server self-test pass. Full local catalogue380/413 passed;33 dependency-related failures remain in that local run. Installed-dependency CI and matched captures are required before a broad pass claim.
Ruling: work in the isolated extracted and hash-verified source archive; no access to prior unpushed workspace. Local git history is a checkpoint, not a reconstruction of upstream commits.
Ruling: continue inline while worker unavailable; independent Gauntlet gate remains open.
Ruling: retain original standalone engine and author bounded procedural foliage rather than introducing unverified external assets; costs remain stylized art, conservative camera geometry and alpha-overdraw requiring hardware profiling.
Final review: self-review, not independent. Remaining gaps and exact evidence boundaries are in docs/gauntlet/tiny-kingdom/LIVING_REVIEW.md.
