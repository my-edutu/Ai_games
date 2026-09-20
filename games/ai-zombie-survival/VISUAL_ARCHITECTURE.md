# Visual Architecture

The world uses an isometric projection `screenX=(x-y)*scale`, `screenY=(x+y)*scale/2-z*scale`. Buildings render side faces plus roofs at real height. Entities are sorted by `x+y` depth. Characters are articulated from torso/head/limb primitives and animate from authoritative action state, with varied zombie cadence by variant.

Lighting/weather are post-world presentation layers. The broadcast camera reads `selectCameraEvent` output and interpolates framing without changing state.
