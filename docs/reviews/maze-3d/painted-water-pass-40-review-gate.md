
# Game 2 pass40 — original painted-water depth, no new stage disclosure (2026-11-01)

**Candidate pending original exact-source browser capture and independent image critique. Nintendo Captain Toad reference remains unpassed.**

## Inspect and reject before changing another parameter

Pass38 lower portrait camera moved the actual tooth/socket from 84.40 to 65.83 CSS pixels but HID Pip behind the physical closed-gate post. Exact SHA-confirmed [visual source artifact 13081404669](https://github.com/my-edutu/Ai_games/actions/runs/41303723468/artifacts/13081404669), original 390×844 2026-11-01T11:52:44.669Z SHA `14b892894bfcd13f9be8b4086dd36caba025f46bbc2171fbcad4ee57c4a4d496`. The four non-gate screenshot scenarios and desktop were unchanged. The camera result was VISUALLY REJECTED despite focused CI success; CPU SwiftShader measurements are not hardware GPU FPS.

Pass39 restored the original camera and tried increasing the public-stage camera pull. Exact SHA-confirmed [visual source artifact 13082936380](https://github.com/my-edutu/Ai_games/actions/runs/41304281998/artifacts/13082936380), native 390×844 2026-11-01T12:00:50.314Z SHA `2471e845fc5faaec5abc984f2127435ae971dad33eed9c445b823ec632ac20cb`. Both public carried key and truly still-closed door-2 are the same original seed `maze-visual-reference-13` tick21. Pass37→39 changes 100,015 / 329,160 pixels above 12 RGB units (30.385%) due to the shifted composition, but the gate is pushed toward the LEFT edge and the far right arch is STILL clipped. The lead judged the original native rendered stage NOT convincingly better. This shift is REJECTED and reverted. Captures verify actual production, not staged geometry.

## Independent new slice

The empty lagoon dominates the verified native composition even when the real actor/physical gate are preserved. Pass40 restores pass37 camera and stage weights, then replaces ONLY the bounded 128×128 **shared water texture pixel formula** with two precomputed tileable interference currents and a narrow sunlit caustic range. No geometry/texture/draw-call additions, new lights, shorelines, paths, secret cells, key changes, collision, camera movement, authority/AI, or nondeterministic randomness. A world regression checks pixel range, dimensions and exact replay stability after public discoveries.

**Visual gate:** compare genuine original pass37 vs pass40 same-seed/tick native and desktop screenshots at 1:1, plus the unchanged official Nintendo references in `reference-manifest.json`. Approve only if the water looks plausibly authored **and** Pip, actual locked gate, eye/key/closed barrier, existing stage remain as legible as before; reject gaudy tiling, aliasing or excessive contrast. Check original dated screenshot SHA-256 against CI manifests. Separate fresh-context critic and Ultracode still blocked by disconnected shared-workspace tunnel. Do not make a Nintendo parity or representative GPU performance claim. Keep draft PR #53 unmerged and undeployed.
