from application_coach.synthetic import make_reviewer_dataset
from application_coach.model import train_calibrator

def test_calibrator_uses_untouched_holdout():
    b=train_calibrator(make_reviewer_dataset(240,seed=4),seed=4); assert b.train_count+b.holdout_count==240; assert b.holdout_count>=60; assert b.metrics["mae"]<b.metrics["constant_baseline_mae"]
def test_model_artifact_hash_is_deterministic():
    data=make_reviewer_dataset(180,seed=8); assert train_calibrator(data,seed=8).artifact_sha256==train_calibrator(data,seed=8).artifact_sha256
def test_holdout_agreement_is_reported():
    b=train_calibrator(make_reviewer_dataset(220,seed=5),seed=5); assert -1<=b.metrics["spearman"]<=1; assert b.metrics["evidence_grounding_precision"]==1.0
