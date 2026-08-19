# Production Hardening Audit

## Checks
1. **Train/evaluate separation:** release benchmark uses an untouched 30% holdout (120 examples) after fitting on 280.
2. **Train/serve parity:** the API review endpoint calls the same `predict_scores()` path and model bundle used by evaluation.
3. **Evidence grounding:** all deterministic evidence spans are verbatim substrings and positive dimension feedback must cite evidence or return `insufficient_evidence`.
4. **Rewrite faithfulness:** quantified and high-risk new facts are rejected; rewriting requires explicit user intent and remains separate from critique.
5. **Fail-closed serving:** `/review`, `/rewrite`, and `/health/ready` return 503 without a configured evaluation artifact.
6. **Traceability:** responses expose model artifact SHA-256 plus model/rubric/prompt/data versions.
7. **Operational isolation:** model/rubric/prompt versions can be rolled back independently.
8. **No outcome claim:** the system does not predict scholarship/job success.

## Representative verification
Holdout MAE 4.3480 vs constant baseline MAE 22.4424; Spearman 0.8398; grounding precision 1.00. This is representative fixture evidence, not real-world impact evidence.
