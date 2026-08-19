from african_moderation.synthetic import make_dataset
from african_moderation.model import train_model, predict
def test_holdout_template_groups_do_not_leak():
    b=train_model(make_dataset()); assert set(b.train_groups).isdisjoint(b.validation_groups) and set(b.train_groups).isdisjoint(b.holdout_groups) and set(b.validation_groups).isdisjoint(b.holdout_groups)
def test_metrics_are_reported_per_language_and_category():
    m=train_model(make_dataset()).metrics; assert m['evaluation_scope']=='held_out_template_groups' and m['macro_f1']>=0.80 and set(m['per_language'])=={'sw','pcm'} and all(v['macro_f1']>=0.75 for v in m['per_language'].values()) and 'sw:threat' in m['per_language_label_recall'] and 'pcm:harassment' in m['per_language_label_recall'] and m['multiclass_brier']<0.30
def test_artifact_hash_deterministic_and_prediction_valid():
    a=train_model(make_dataset()); b=train_model(make_dataset()); p=predict(a,'nitakupiga tomorrow friend','sw'); assert a.artifact_sha256==b.artifact_sha256 and p['label'] in {'safe','harassment','threat'} and 0<=p['probability']<=1
