# Pass206 — reduced-motion Pip braces only with the real public pressure mechanism (2026-11-08 UTC)

**Scope:** existing draft PR #53, `feat/maze-3d-gauntlet`. Original Nintendo *Captain Toad: Treasure Tracker* benchmark **NOT MET**.

## Concrete player-facing defect

Pass205 correctly leaves the real Three.js bronze relays, ivory shutters, piston, diaphragms and both Tide-Shear jaws at rest if the published trap is only diagonally visible in reduced-motion mode. Yet the physical Pip rig still interpreted any positive diagonal pressure strength as a full brace. Pip visibly ducked and raised a lantern at a mechanism that did not move. This breaks the same on-stage cause-and-effect the prior Gauntlet stages were intended to establish.

## One coordinated production change

Publish the **actual modeled** binary reduced-motion pressure state through the existing `world.publicPressureProgress(cell)` API: **0** outside current, public near-contact, **1** during authentic contact. The normal-motion three-beat progress remains unaltered. The real 3D Pip rig in reduced-motion mode now accepts the pressure gesture only from that identical binary witnessed mechanical state, not solely proximity strength. No new HUD text, geometry, animation clock, player control, hazard/damage rule, navigation decision, collision, map inference, renderer allocation or privacy-sensitive field.

A tightened production-installed Three regression walks the same public world mechanism through visible far, diagonal, adjacent, retreat, hidden and terminal states; reads the actual mechanical output, then inspects the *real Pip rig's* torso and head for neutral versus triggered physical reaction. It preserves prior six-run resource and NDC acceptance thresholds and source immutability.

## Evidence and limits

Last successfully rendered source: [Maze WebGL 42429364155](https://github.com/my-edutu/Ai_games/actions/runs/42429364155), [unaltered 37-frame artifact 13597475546](https://github.com/my-edutu/Ai_games/actions/runs/42429364155/artifacts/13597475546); this run verified 35 individual PNG SHA sidecars and the two original gate-transition manifest hashes. These screenshots **precede Pass203–206**, and cannot demonstrate this correction. PR HEAD at start: `06a752f4d8b8d6368073f7d974d1d47d5d0ee1a3`. Both Pass205 exact-HEAD [WebGL 42454100966](https://github.com/my-edutu/Ai_games/actions/runs/42454100966) and [whole CI 42454100988](https://github.com/my-edutu/Ai_games/actions/runs/42454100988) were queued. Coding workspace, separate worker/Ultracode and native browser remain disconnected. **This production candidate is not yet tested, rendered or independently critic-approved**. Demand completed exact-new-HEAD CI/native Playwright PNGs on 320/390/844/1280 and direct fixed-reference comparison before claiming a visible win.

The biggest visual gap remains a crowded, gate-dominated Pip-to-jaws composition even in older correctly full-framed mobile WebGL. Preserve the original strict <100 geometries, six-run spread≤8, ±.95 actor/mechanism NDC, and guardian withdrawal≥.70. PR stays **OPEN DRAFT**, no merge, deploy, force-push or premature pause.
