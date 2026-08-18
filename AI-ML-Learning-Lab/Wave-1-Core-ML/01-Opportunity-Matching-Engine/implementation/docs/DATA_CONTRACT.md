# Data Contract

`UserProfile` and `Opportunity` are versioned through the Python package/API contract. Pydantic rejects malformed ages, fees, experience values and invalid enum values before ranking.

Training records require `user_id`, `opportunity_id`, `event_time`, a feature map constrained to [0,1], and graded relevance label 0–3. Dataset snapshots are sorted deterministically and accompanied by SHA-256 hashes. Invalid rows are counted rather than silently coerced.

Protected attributes are not training features. Raw identifiers are used only for reproducibility and audit joins; production deployments should pseudonymize them at ingestion and set organization-specific retention periods before collecting live interactions.
