# Visual Rebuild Audit

Evidence basis: repository inspection of the premium Marble branch and the current isolated rebuild branch. Completion claims below are intentionally conservative.

| System | Status | Evidence / finding |
|---|---|---|
| Tournament rounds, quotas, entrants, advancement | PASS | Existing authoritative TypeScript runtime and rule tests are present. |
| Deterministic seeds / replay-oriented authority | PASS | Fixed-point simulation and seeded generation are existing core systems. |
| Elimination / winner state | PASS | Authority snapshot exposes lifecycle, qualified/eliminated/champion state and official events. |
| Ground-plane collisions | PASS | World bounds, marble pairs, blocks, bumpers and moving sweepers are resolved by the deterministic solver. |
| Full vertical rigid-body gravity | MISSING | Authority is intentionally a 2D fixed-point ground-plane solver. No claim of 3D rigid-body gravity is made. |
| Ramps / vertical jumps / pendulum rigid bodies | MISSING | Not represented in authoritative state yet. |
| Browser rendering before rebuild | PLACEHOLDER | Premium runtime used Canvas 2D gradients, circles and fake depth. |
| WebGL volumetric rendering | PASS | Rebuild adds a WebGL2 renderer with sphere, box and cylinder geometry. |
| Marble rolling presentation | PASS | Sphere orientation is advanced from authoritative velocity; it cannot change physics. |
| Lighting / material response | PASS | WebGL fragment lighting provides directional diffuse/specular/ambient response. |
| Contact shadows | PASS | 3D projected contact geometry is rendered beneath active marbles. |
| Constructed arena | PASS | Deck, understructure, guard rails and finish gantry are geometry. |
| Obstacles / bumpers / sweepers / pits | PASS | Existing authority geometry is represented as 3D machinery/hazards. |
| Broad obstacle library | PARTIAL | Rotating beams, pistons, crushers, pendulums, conveyors and destructible systems are not authoritative yet. |
| Multiple visual themes | PARTIAL | Each current round archetype receives distinct deck/trim/accent/lighting treatment; these themes do not silently alter fairness. |
| Broadcast camera | PASS | Browser consumes server camera directives and performs presentation-only smoothing. |
| Near-death / danger focus | PASS | Existing server directive modes are consumed by the 3D camera. |
| VFX | PARTIAL | Deterministic event-driven particles exist for elimination/recovery/qualification/champion events. |
| Audio | PARTIAL | Existing browser event tones remain; full machinery/rolling/spatial mix is not complete. |
| HUD | PARTIAL | Existing premium compact HUD remains. Further arena-first reduction is still subject to runtime critique. |
| Browser screenshots | MISSING | Must be captured from the actual running branch; conceptual images are not accepted. |
| Measured FPS / draw calls / memory | MISSING | Optimizations are designed in, but measurements must come from runtime evidence. |
| Eko / other active games modified | PASS (NO) | Rebuild changes are Marble-scoped; protected game paths are not part of this work. |

## Baseline conclusion
The previous visual runtime was not a genuine 2.5D/3D marble spectacle. The authoritative tournament foundation is materially stronger than the presentation. The rebuild therefore preserves authority and replaces the presentation first, while explicitly leaving unsupported vertical rigid-body mechanics incomplete rather than faking them.
