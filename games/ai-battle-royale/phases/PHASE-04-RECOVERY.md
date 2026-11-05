# Phase 4 — replay and recovery

Owner: runtime owner. Acceptance: checkpoints round-trip throughout every lifecycle and reject corrupt/inconsistent state; public projections remain bounded and private planning data stays private. Serialization is implemented. Durable host storage, crash-resume and writer leases remain open; verify those before production promotion.
