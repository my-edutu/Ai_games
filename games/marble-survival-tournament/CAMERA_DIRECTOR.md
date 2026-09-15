# Camera Director

## Authority boundary

Camera decisions are presentation state only. They consume sanitized snapshots and semantic events and cannot mutate simulation state, actions, collisions or outcomes.

## Modes

- `overview` — establishes the full arena and tournament context.
- `cut-line` — frames competitors around qualification pressure.
- `danger` — follows threatened/recovering marbles.
- `finish` — biases framing toward the finish zone.
- `victory` — closes in on the confirmed champion.

The existing deterministic camera directive chooser remains the semantic source. The Three.js layer converts the directive into perspective-camera targets and smooth movement.

## Motion rules

Camera motion uses exponential smoothing, bounded offsets and restrained impact impulse. There is no random continuous orbit. `prefers-reduced-motion` disables most interpolation/impact shake. Arena overview framing scales from track dimensions; focus modes use marble world positions.

## Integrity

Camera shake is driven by sanitized collision events and decays independently of authority. Render quality and camera mode are never inputs to the solver.

## Replay status

Live camera direction is implemented. Recorded-state replay camera shots remain unimplemented and are not claimed.
