# Animation System

## Presentation model

The climber is an articulated procedural silhouette driven by authoritative position, velocity, facing, shield and player-state data. Browser interpolation smooths the 20 Hz state feed without modifying simulation state.

## Current motion language

- Idle/low speed: stable upright stance.
- Run/sprint: speed-scaled opposing limb swing.
- Jump/fall: airborne leg extension and reduced run cycle.
- Facing: full character orientation follows authoritative facing.
- Shield: bounded defensive field surrounding the body when charges are present.
- Hit/danger: camera and danger treatment supplement the authoritative state.
- Guardian encounter: framing and lighting make the climber/guardian relationship readable.

## Required state fidelity

Animation is never allowed to move the authoritative collision body. Visual position interpolates toward snapshot position; it does not predict outcomes. Teleportation is only displayed if authoritative state actually changes discontinuously.

## Remaining production animation work

A true skeletal/rigged asset pipeline with authored clips for ledge grab, pull-up, hard-land, attack, dodge, exhaustion, death and checkpoint celebration remains a future production-art increment. The current implementation replaces the placeholder rectangle and provides procedural movement correlation, but it must not be described as a complete authored character animation set until those clips/assets exist.