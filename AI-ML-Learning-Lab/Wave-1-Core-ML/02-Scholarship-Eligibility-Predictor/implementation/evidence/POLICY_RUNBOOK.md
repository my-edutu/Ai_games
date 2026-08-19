# Policy Update Runbook
owner: Scholarship Content Operations

1. Capture the authoritative scholarship source and effective date.
2. Encode criteria into a new immutable policy version.
3. Validate age, GPA, citizenship/residency, degree, field, and deadline boundary fixtures.
4. Review all `unknown` mappings; ambiguity must return `needs_review`.
5. Register the policy version and activate only after review.
6. Monitor unknown-field and parse-failure rates after activation.
7. Roll back the policy version independently of the predictive model if criteria behavior regresses.
