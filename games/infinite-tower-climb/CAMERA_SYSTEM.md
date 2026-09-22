# Camera System

The camera is a presentation-only broadcast director driven by immutable render snapshots.

## Base tracking

- Smooth X/Y tracking rather than fixed horizontal centering.
- Positive vertical velocity gets stronger anticipation than falling velocity so upcoming platforms remain readable.
- Horizontal velocity biases framing toward travel direction.
- Target position remains bounded inside the current tower chunk.

## Event framing

- **Hazard danger:** at high danger, frame the player and nearest active hazard together.
- **Guardian:** frame midpoint between climber and active guardian and widen to approximately `0.86` zoom.
- **Speed:** faster movement subtly widens framing.
- **Near danger:** server camera impulse is converted to small bounded presentation shake.
- **Milestones:** renderer supplies visual emphasis without changing camera authority or simulation time.

## Accessibility

Reduced-motion mode forces zoom to `1`, disables camera impulse and uses slower tracking. Camera behavior never changes collision, AI observation or authoritative time.

## Guardrails

No hard cuts during ordinary ascent. No rapid zoom oscillation. No camera target may follow a removed entity. Hazard/guardian framing yields to chunk bounds so the renderer never intentionally exposes outside-world voids.