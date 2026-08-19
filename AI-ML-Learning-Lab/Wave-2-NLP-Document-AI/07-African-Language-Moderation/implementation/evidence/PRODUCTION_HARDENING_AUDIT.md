# Project 07 Production Hardening Audit

- Supported languages/categories are explicit; unsupported language requests fail validation.
- Training, validation-threshold, and release-holdout template groups are disjoint.
- Metrics are reported per language and per language/category, not aggregate-only.
- API and model prediction paths are identical; API fails closed without a configured model.
- Low-confidence and quoted/reported harmful content abstain to human review.
- Reviewer snippets are grounded in submitted text; code-switch/context signals are surfaced.
- Model artifact, policy and data versions are traceable.
- Native-speaker validation is false and forces `controlled_only` deployment.
- Representative macro F1 1.000; multiclass Brier 0.0631; `sw` F1 1.000; `pcm` F1 1.000.
- Representative fixtures are engineering evidence only; broad production is blocked pending native-speaker annotated shadow validation.
