# Model Card — Scholarship Suitability
owner: ML Platform
status: controlled-deployment candidate

The predictive layer estimates application suitability; it does not decide policy eligibility and is not a guarantee of scholarship acceptance or funding. The selected candidate is a post-calibrated interaction logistic model chosen against a transparent logistic baseline using PR-AUC, Brier score, and a high-cost cohort recall guardrail.

Protected attributes are excluded from predictive features. The model abstains when required predictive inputs are missing or GPA scale is unsupported. Representative benchmark evidence must not be presented as real-world impact evidence.
