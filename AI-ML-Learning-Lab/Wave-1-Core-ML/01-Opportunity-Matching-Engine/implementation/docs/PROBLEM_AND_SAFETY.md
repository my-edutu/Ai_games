# Problem and Safety Contract

The engine ranks opportunities for a user **after** hard eligibility has been evaluated. It supports scholarships, internships, fellowships, grants, jobs and training opportunities.

## Decision boundary

The engine may filter opportunities that deterministically violate explicit eligibility or user constraints, then rank the remaining set. It must not apply on behalf of the user, infer protected traits, claim acceptance probability, or hide the explanation for a recommendation.

## Acceptable errors

A soft-ranking error may place a relevant eligible opportunity lower than ideal. A hard-eligibility false negative is higher severity because it can hide a viable opportunity; eligibility rules therefore remain deterministic, testable and independent of learned scores.

## Protected attributes

Gender and disability-status fields may be collected only when separately justified for outcome auditing and consented evaluation. They are explicitly excluded from `ranking_feature_dict()` and never enter model features.

## Success metrics

Primary: NDCG@5. Secondary: Precision@5, Recall@5, MAP, eligible-set coverage, cohort recall gaps, API error rate and latency. Release requires learned NDCG@5 to exceed the deterministic baseline on the fixed representative benchmark and zero unresolved P0/P1 safety incidents.
