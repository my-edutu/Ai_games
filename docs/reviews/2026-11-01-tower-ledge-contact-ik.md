# Infinite Tower Climb — Gauntlet 36: real-platform near-ledge fingertip reach

**Pre-edit head:** 86b7d77ce7da86e531fd4b0d636ec09188195c60. **Review:** SELF-REVIEW ONLY; worker tunnel disconnected (`NOT_FOUND`).

## Evidence and selected failure

Inspected actual Gauntlet 35 390×844 GPU combat PNG (Tower Combat workflow [41248659078](https://github.com/my-edutu/Ai_games/actions/runs/41248659078), artifact 13060676933), and real G34 55.36-second climbing WebM. [G35-to-current-head comparison](https://github.com/my-edutu/Ai_games/compare/77214e61ec3d7922072bb0a52b64e4eeeb488ec0...86b7d77ce7da86e531fd4b0d636ec09188195c60) shows only documentation changes. Existing reach is camera/velocity-directed, not grounded to a ledge; neither real reach geometry nor complete Jusant-like climbing contact has been demonstrated.

**One independently judgeable change:** when the public current tick-adjusted intended platform is near a rising, living, non-attacking climber, choose an in-bounds top point on its actual deck (radius 25, within real deck span 22.4–27.18). Reject absent, high, remote, invalid, falling and standing cases. Use an analytic two-link solution for the actual mechanical arm with lengths 0.38 and hypot(0.802,0.108) local units. Convert the world target through the current pose's torso and root matrices; align shoulder and forearm so the authored fingertip meets the selected location. On unreachable targets retain the original airborne pose. This is a near-ledge touch, NOT a new grasp/latch/jump outcome; physics, deterministic replay, AI and root position are unchanged.

## Verification and limitations

* **Static RED:** selector and solver missing on parent 86b7d77ce7da86e531fd4b0d636ec09188195c60; source-before lacks these functions.
* **Pure-JavaScript admissibility/numerical checks:** 12/12 GREEN in implementation harness on exact helper bodies, covering rising/standing/descending/dead/attacking/far/high/invalid platform and preserved two-link lengths. These are NOT full build or GPU passes.
* Added `tests/phase3/tower-ledge-geometry-contact.test.cjs` with real-source extraction, moving-deck fixtures, and a Three.js rig test for actual fingertip/world contact and reset. New-commit Node/Three CI, browser capture and complete motion are **PENDING** at this commit.
* Exact prior G35 dedicated Landing, Combat, Guardian, Realism and Motion evidence all succeeded; [current head catalogue CI 41249357036](https://github.com/my-edutu/Ai_games/actions/runs/41249357036) was cancelled, not passed.
* Independent reviewer and browser/code worker unavailable. No full-motion, commercial comparison, intended-device sustained FPS, UX/accessibility or soak pass. Software-renderer submissions and stills are not FPS metrics.

**Next priority:** inspect new-source GPU/motion on an actual near-ledge encounter; verify that the finger really reaches the top, does not penetrate masonry, and that pose transitions are smooth at gameplay speed. A blank or unrelated screenshot is a verification blocker, not proof of better climbing. Overall Gauntlet 90 **NOT ACHIEVED**; PR #58 draft, nothing merged, force-pushed or deployed.
