# AI Maze Escape 2.5D Rebuild Design

**Date:** 2026-09-15

## Goal
Transform the existing autonomous maze broadcast from a flat grid/debug visualization into a cinematic 2.5D exploration game while preserving authoritative simulation, AI, deterministic generation, recovery, privacy, persistence, and run lifecycle behavior.

## Approved art direction
**Hybrid: Lost Facility Inside Ancient Ruins.** Stone corridors, roots, collapsed chambers and shrine-like spaces are fused with abandoned research infrastructure, metal service passages, emergency equipment, locked facility doors, machinery, pipes and restrained technological lighting. The visual language must remain coherent rather than mixing unrelated themes.

## Architecture
The authoritative engine remains unchanged. The browser receives the existing sanitized public snapshot and passes it through a presentation-only adapter:

`authoritative runtime -> public snapshot -> world-state adapter -> WebGL2 world renderer -> camera/lighting/fog -> compact HUD`

Presentation variation is deterministic and derived only from public state. It must never write back to authoritative state, reveal hidden cells, fabricate threats, or use ambient randomness.

## Rendering approach
Use dependency-free WebGL2 in the existing browser source. This avoids changing repository-wide dependencies and preserves the current broadcast host. Geometry is real 3D: floor slabs, wall prisms with height/thickness, door geometry, key objects, traps, exit structures, props and a multipart explorer. Depth testing and perspective projection are mandatory.

## World model
Known public maze cells become modular spaces. Cell topology controls openings and walls. Deterministic room archetypes add visual identity: ruin corridor, service tunnel, root breach, machine pass, torch gallery, junction lab, pillar hall, collapsed sanctum, archive shrine and research nexus. Unknown connected neighbors are represented with frontier fog rather than inferred hidden geometry.

## Character and AI readability
The explorer is a physical multi-part character. Animation is presentation-only and may communicate movement, caution and low confidence. The camera uses smooth tracking and public route look-ahead so AI intent is visible through behavior before HUD text.

## Fog and lighting
Unknown frontiers receive dark volumetric-like geometry and distance fog. A shader combines ambient/directional light with an explorer-local light contribution. Keys, exit structures, traps and facility/ruin materials use restrained contrast instead of neon saturation.

## Camera
Primary view is cinematic isometric/three-quarter perspective. Camera target follows the explorer and public planned route. Zoom remains bounded by the existing presentation director. No camera choice may alter simulation outcomes.

## HUD
World target: approximately 85–90% of the horizontal broadcast frame. HUD is compact, secondary and removable in clean-feed mode. It retains discovery, keys, objective, time, AI intent/confidence and integrity.

## Verification
TDD contract requires WebGL2, physical world functions, explorer/fog/interactable hooks, deterministic presentation, and removal of the legacy flat grid renderer. CI must then run the complete repository suite, stream-host self-test and Chromium browser capture. Screenshots must be reviewed before completion is claimed.

## Isolation
Only AI Maze Escape presentation, AI Maze Escape documentation and maze-specific tests may change. `games/eko-street-run/**`, Infinite Tower Climb and AI Ant Colony are out of scope and must remain untouched.
