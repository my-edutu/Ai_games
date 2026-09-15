# Viewer Interaction

Supported normalized events are `supply-drop`, `district-pressure` and `camera-focus`. Supply magnitude is capped to 12 units, pressure to ±0.15 and camera weight to [0,1]. Events are idempotent by external ID and appended to an audit ledger.

No viewer event guarantees death, infection, survival, victory or evacuation.
