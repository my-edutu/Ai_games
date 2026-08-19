# Rollback Plan
owner: ML Platform / Scholarship Content Operations

Policy rollback and model rollback are independent. If policy/data alerts fire, restore the prior scholarship policy version while leaving the model unchanged. If model drift/calibration alerts fire, revert to the previous model or disable suitability while continuing deterministic eligibility. During uncertainty, preserve policy results and suppress predictive suitability rather than guessing.
