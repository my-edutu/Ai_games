# Worker Reliability Predictor Design

Build a governed event-level operational risk-support system for attendance, completion, or cancellation risk. It must never collapse a worker into a permanent reliability score.

## Safety architecture
- Predictions are scoped to a specific work event/task and timestamp.
- Protected attributes and obvious demographic proxies are excluded from model features.
- High-risk predictions are advisory only and require human review for consequential decisions.
- Workers can inspect reason codes, challenge incorrect source data, and have corrections reflected in future predictions.
- Missing or stale evidence can trigger abstention/review rather than confident prediction.
- Outputs never label a person as reliable/unreliable.
