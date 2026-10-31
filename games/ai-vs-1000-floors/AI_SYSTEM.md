# Autonomous policy

The core advances at 30 fixed ticks per second. The browser worker owns mutable campaign state; the scene receives frozen render snapshots. `stepCampaign(state, ticks)` is also executable headlessly, making acceleration and replay independent from rendering.

At a segment boundary, the policy examines a hazard at the next route node. It waits when danger is active or the remaining inactive interval is shorter than the conservative traversal window. It then walks or jumps along the generated segment. Independent collision checks run during movement and dwell, so a policy error can produce a real hit.

The `intent` field describes observable behaviour: waiting, crossing, recovery or completion. It must not claim path planning, deliberation, learning or route selection beyond what is implemented. The hovering companion is presentation; it has no hidden authority over health, timing or rewards.

Seeded content uses the public shared random stream implementation. No wall clock, frame delta, remote model result or unseeded random number changes campaign outcomes. Retain the campaign version, seed and checksum in saved evidence. Checksum validation detects accidental corruption; it is not a cryptographic authentication or anti-cheat boundary.
