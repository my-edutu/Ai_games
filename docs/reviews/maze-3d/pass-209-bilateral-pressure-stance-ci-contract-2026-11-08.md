# Pass209 — correct the two-foot physical pressure contract (2026-11-08 UTC)

Existing OPEN DRAFT Game 2 PR #53; original official *Captain Toad: Treasure Tracker* quality bar remains **UNMET**.

## Verified source mismatch (Phase 0, not decorative polish)

Pass208's new installed-Three assertion for `hip -1` incorrectly demanded a **positive** Z rotation. The actual original body code mirrors sides: `sign=i===0?1:-1`; in a pressure shutter beat at public stage 0.55, `pressureBrace=(.55-.20)/.50=.70`. Consequently the modeled right and left hips turn **+0.14** and **-0.14** radians, respectively. The prior assertion (`leftHip.rotation.z > neutral+.10`) is impossible despite correct outward planting, and would reject a real physical performance before rendering. The stricter replacement checks BOTH sides against the unchanged +/−0.10 minimum and checks both joints return exactly to neutral on pressure withdrawal. This is a necessary build-gate repair, **not a fresh visual/gameplay win**. No production geometry, camera, actor motion, privacy, gameplay, thresholds or resources changed.

## Pending acceptance

Source and assertion algebra were examined at exact predecessor HEAD `79e6de3e2226088da805d160a7968e8163770854`. GitHub queue remains blocked for full Node/Three execution and source-matched Playwright WebGL; coding workspace and fresh independent critics/Ultracode are disconnected. No test result, current-SHA original PNG, full-frame framing check or Nintendo-quality approval is claimed. Run `node --test tests/phase3/maze-3d-pressure-pip-reaction.test.cjs` then unchanged focused screenshot CI, six runs <100 geometries/spread <=8, ±.95 NDC and Warden withdrawal >=.70, and authentic 320×740, 390×844, 844×390, 1280×900 physical-beat images. Judge the pending Pass204 camera, Pass207 wing cutaway and Pass208 Pip acting against original baseline and official Nintendo visuals before another visual tweak. No merge/deploy/force/concurrent overwrite. Hourly Gauntlet continues.
