# Monitoring Specification
owner: ML Platform / Scholarship Content Operations

Policy/data signals: unknown required-field rate, criteria parse failures, stale source/version, policy decision distribution. Model signals: suitability probability distribution shift, Brier/calibration drift when labels mature, subgroup recall/precision, abstention rate, latency, and errors.

Primary alerts distinguish `policy_data` from `model` failure domains. Suggested initial thresholds: unknown field rate >10%, criteria parsing failure >5%, probability-mean shift >0.15. Thresholds require real traffic tuning before broad deployment.
