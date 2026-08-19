from opportunity_fraud.synthetic import make_dataset
from opportunity_fraud.dataset import snapshot_dataset, quality_report
def test_snapshot_is_deterministic_and_quality_report_tracks_imbalance_duplicates():
    rows=make_dataset(20,8,seed=2); a=snapshot_dataset(rows); b=snapshot_dataset(rows); assert a['sha256']==b['sha256'] and a['rows']==160; q=quality_report(rows); assert 0 < q['positive_rate'] < 0.5 and q['campaigns']==20 and q['duplicate_text_groups']>=1
