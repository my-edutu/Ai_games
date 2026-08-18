# Model Card — Opportunity Matching Engine gbdt-v1

## Intended use
Rank already-eligible opportunities for a user using non-sensitive profile-fit signals.

## Model
Gradient-boosted regression over seven bounded features: skill overlap, preferred-skill overlap, interest overlap, type preference, location preference, education margin and experience margin. Hard eligibility is not learned and cannot be overridden by the model.

## Evaluation
The committed benchmark is deterministic and synthetic/representative; see `../reports/BENCHMARK.json`. It is suitable for engineering verification and learning, not proof of real-world impact.

## Safety
Protected attributes are excluded. Sparse profiles and duplicates are surfaced. Operators must monitor cohort outcomes and drift. High-stakes acceptance decisions remain with opportunity providers and users.
