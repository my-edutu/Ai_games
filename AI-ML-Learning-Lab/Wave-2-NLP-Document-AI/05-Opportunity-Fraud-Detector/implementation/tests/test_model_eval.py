from opportunity_fraud.synthetic import make_dataset
from opportunity_fraud.model import train_risk_model, predict_probability

def test_campaign_holdout_has_no_campaign_leakage():
    ds=make_dataset(48,14,seed=5); b=train_risk_model(ds,seed=5); assert set(b.train_campaigns).isdisjoint(b.holdout_campaigns); assert b.holdout_count>0 and b.train_count>b.holdout_count
def test_release_metrics_are_holdout_only_and_better_than_constant():
    ds=make_dataset(60,12,seed=8); b=train_risk_model(ds,seed=8); m=b.metrics; assert m['evaluation_scope']=='held_out_campaigns'; assert m['brier'] < m['constant_baseline_brier']; assert m['pr_auc'] > m['positive_rate']; assert m['precision_at_review_budget'] >= 0.55; assert m['severe_recall_review_queue'] >= 0.90; assert m['precision_review_queue'] >= 0.55; assert m['effective_review_fraction'] < 0.5; assert m['review_budget'] == 0.1
def test_artifact_hash_is_deterministic_and_probability_bounded():
    ds=make_dataset(45,10,seed=9); a=train_risk_model(ds,seed=9); b=train_risk_model(ds,seed=9); assert a.artifact_sha256==b.artifact_sha256; p=predict_probability(a,ds[0].record); assert 0 <= p <= 1
def test_holdout_campaigns_are_temporally_after_training_campaigns():
    ds=make_dataset(50,10,seed=12); b=train_risk_model(ds,seed=12); train_dates=[r.record.created_at for r in ds if r.record.campaign_id in set(b.train_campaigns)]; hold_dates=[r.record.created_at for r in ds if r.record.campaign_id in set(b.holdout_campaigns)]; assert max(train_dates) < min(hold_dates)
