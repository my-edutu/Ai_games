# Infinite Tower Climb — Gauntlet 38: exterior ledge approach

**Parent:** bcbf2bf89b04fe1bdca7f867a02218bf9e362c29. **Selected failure:** G37's real seeded, tick-298 GPU desktop and portrait images show helmet/body penetrating opaque 3D stone while measured fingertip contact is mathematically exact. The route uses an authoritative one-way 2D deck mapped into an opaque annulus; scene translation remained on radius 25, inside the 22.4–27.18 solid top.

## Test first — actual RED

Committed tests alone at [bcbf2bf](https://github.com/my-edutu/Ai_games/commit/bcbf2bf89b04fe1bdca7f867a02218bf9e362c29). The dedicated [Tower Ledge Contact CI run 41261387676](https://github.com/my-edutu/Ai_games/actions/runs/41261387676) **FAILED in the expected geometry source checks** (existing seven tests passed; two new assertions failed). This was an intentionally red draft-branch test commit, not a production pass or an unrelated flaky failure.

## One implementation

Added a pure scene-level exterior-approach radius that engages only for a valid rising, alive, non-attacking character horizontally near its authentic target, smoothly increases radius from 25 to 28.05 before the helmet meets the opaque slab, and returns to ordinary grounded mapping. The exact same immutable public deck selects the outside lip at radius 27.1 as the fingertip target. No physics, simulation timing, random streams, collision, replay, authoritative platform transforms or new GPU meshes. Follow interpolation naturally eases the return to the walking lane. Added actual animated helmet center and conservative helmet-to-rim clearance diagnostics; the existing authentic-source Playwright capture now rejects rim intersection and an interior root. Existing physical IK alignment assertion remains strict, so unreachable arms FAIL rather than being hidden.

## Verification and caveats

**GREEN PENDING** at source-implementation commit: dedicated logical + source-bound GPU CI, desktop/portrait screenshot inspection, complete motion, and exact-body appearance. The helper is a presentation mapping; it should not be confused with implementing true grab/collision physics, nor claimed Jusant-quality. Robot-to-rim proximity is assessed with a conservative envelope around the helmet, not a full triangle-to-triangle collision proof. Validate hand reach and rapid snapshots, then assess visible posture before future environment art.

**Self-review only.** The chat coding-worker tunnel returned `NOT_FOUND`; no fresh independent critic is claimed. Commercial Jusant/ASTRO BOT, accessible UI, intended-device sustained FPS and stability gates remain OPEN.

**Next:** use exact-commit real GPU ledge screenshots and continuous approach video to judge arm contact, visible helmet/torso overlap, and lateral pop. Record artifact run IDs and negative observations. Keep PR #58 draft; do not merge or deploy.
