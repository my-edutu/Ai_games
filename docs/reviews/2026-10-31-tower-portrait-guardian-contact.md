# Infinite Tower Climb Gauntlet 25 — portrait guardian contact

Scope: PR #58 baseline ba48f316, existing draft branch. Explicit SELF-REVIEW only; disconnected critic workspace, no Ultracode.

## Actual failure
Before editing downloaded and opened four original real WebGL screenshots from Tower Combat Impact Evidence 41204654198, artifact 13044256868, at https://github.com/my-edutu/Ai_games/actions/runs/41204654198/artifacts/13044256868 . At 390x844 both tick268 and tick269 omit the guardian despite authoritative guardian HP8→7 and observedEnemyImpacts=1; a cue is partially clipped at screen left. Desktop 960x600 shows the guardian. These held stills do not prove FPS or full-speed motion.

Exact ba48f316 seed at tick269 checksum af60b546: hero x207000, guardian x159173, outgoing enemy bolt x231173 vx+12000. Camera prioritized the already receding bolt, leaving the guardian hitbox left edge at normalized x=-2.271.

## Single failure corrected
Camera now discards enemy bolts moving away from the hero as a framing threat, preserving approaching bolt priority. For active portrait guardian combat only, a bounded 0.75-radian oblique view with core-clear sightline and hero size >=15% reserves room for shield/maul. The framing applies throughout the engagement rather than attack-flag toggles, preventing an abrupt camera jump on recovery. No simulation, AI, combat, collision, renderer assets, hitboxes, seeded replay, or gameplay authority changed.

## Measured validation
Original candidate TDD RED: guardian frame and receding projectile tests 0/2; during refinement attack-only transition regression RED. Final local 3/3 new focused camera tests, related 15/15 composition/landing/impact tests PASS; npm run build PASS; stream host self-test ok:true for authority/replay/privacy/recovery/restart; Node syntax and workflow YAML PASS. Whole Tower suite timed out after 142 passing subtests without final summary: no full PASS. Local Chromium page.goto blocked with ERR_BLOCKED_BY_ADMINISTRATOR; new-source GPU unverified here.

Tower Combat Impact Evidence workflow now runs the camera regressions before authentic before/after capture. Inspect its exact-head CI and downloaded portrait/desktop PNGs before a visual PASS; collision-hitbox projection alone cannot prove the armored silhouette/maul visible. Normal-speed full attack/recovery, accessible UI, real-device presented FPS/soak, independent Jusant and ASTRO BOT Rising Heat comparisons remain open. Overall Gauntlet NOT ACHIEVED. PR remains draft, no force-push/merge/deploy.
