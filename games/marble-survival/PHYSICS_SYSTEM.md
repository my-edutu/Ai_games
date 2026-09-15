# Physics System

## Current authority
Marble competition uses the existing deterministic fixed-point 2D ground-plane solver. It resolves world bounds, static rectangular obstacles, circular bumpers, moving sweepers and marble-to-marble contacts using bounded substeps, restitution, mass traits, friction and capped contact budgets.

This authority remains the source of truth. Browser animation cannot change positions, velocities, qualification, elimination or winners.

## 2.5D presentation mapping
Authority X/Y coordinates map to the WebGL arena X/Z plane. Marble sphere rotation is derived from authoritative velocity and is presentation-only. Contact shadows and vertical mesh height are visual grounding, not hidden gameplay forces.

## Integrity rules
- cosmetics never change mass, acceleration or restitution;
- no browser-side collision or winner logic;
- no rescue from legitimate competitive mistakes;
- deterministic sweepers use the same triangle-wave timing as authority;
- unsupported mechanics are not simulated cosmetically as if authoritative.

## Explicitly incomplete
Full 3D gravity, angular momentum as authority, ramps, jumps, moving vertical platforms, pendulums, conveyors, water drag, ice friction and destructible collision topology are not yet part of the authority model. They require schema + deterministic solver extensions and tests before they can be treated as gameplay mechanics.
