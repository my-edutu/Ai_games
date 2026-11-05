# Autonomous behavior

Drivers choose connected origin/destination routes using deterministic named random streams. A fixed 30Hz update applies signal phases, walking clearance, safe vehicle movement, pending entry and bounded event/metric updates. Model calls are not part of the real-time loop.

The authority enforces lane spacing, reserved junction access and receiving-lane clearance. Drivers brake and queue when admission is unsafe. Bounded congestion reroutes preserve the current position and original destination; route changes cannot teleport the vehicle or silently complete its trip. Demand metering constrains entry before congestion consumes all capacity.

Citizens choose reachable walking destinations. Crossing permission is tied to the authoritative walk phase and physical clearance. Corner occupancy and separation are correctness invariants; identical positions are not accepted as a cosmetic limitation.

The fixed policy uses a declared phase schedule. Adaptive timing uses actual waiting demand within bounded minimum/maximum phases. All intent copy shown to viewers is derived from state and events; no hidden model reasoning is displayed.

Verification includes seeded repeatability, exact serialization after restore, multi-seed sustained progress and physical-separation probes. The independent review report records the executed seed/duration corpus. Passing that corpus is evidence for those scenarios, not proof of all possible city traffic behavior.
