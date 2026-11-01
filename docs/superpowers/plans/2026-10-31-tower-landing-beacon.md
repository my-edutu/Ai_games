# Tower destination readability implementation plan

Goal: distinguish the AI's real intended landing from competing decks without adding gameplay prose or changing authority.
Architecture: add one small, depth-tested, camera-facing double-chevron above the selected physical deck; retain the collider-aligned surface bracket. Reuse owned geometry/materials. No extra lights, bloom, third-party assets or simulation changes.
Spec: games/infinite-tower-climb/GAUNTLET.md and the user-approved complete-3D Gauntlet brief.

Ruling: discard the uncommitted earlier camera replacement. Concurrent commit 05d3633 already improves camera, characters and HUD. Its real tick-379 phone image and recorded review still identify competing landing decks. Preserve all concurrent work and address only that remaining issue.

- [x] Reproduce absence of a distinctive, bounded destination beacon with focused tests.
- [x] Implement one reusable double-chevron; it must follow effective moving-platform coordinates, disappear with invalid/consumed intent, honor normal depth testing, and avoid authority mutations.
- [x] Run build, all Tower logical tests and the stream-host self-test.
- [ ] Add real WebGL capture/regression coverage on GitHub Actions because the local managed browser blocks navigation. Inspect actual downloaded pixels; stills are not a motion/FPS pass.
- [ ] Update the chronological progress journal with exact scope, results and next gap. Publish with an expected-head lease to the existing draft branch. No merge/deployment.

Review focus: narrow platforms, moving decks and floating origin, stale intentions at contact/death/results, repeated graphics resource recovery, low/high graphics and portrait/landscape visibility.
Reviewer: inline self-review only while the connected subagent workspace is disconnected. Independent comparative win remains unverified.
