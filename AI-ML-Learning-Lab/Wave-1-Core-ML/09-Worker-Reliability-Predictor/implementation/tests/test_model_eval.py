import numpy as np
from worker_reliability.synthetic import representative_dataset
from worker_reliability.model import train_candidates, choose_model, event_risk_prediction
from worker_reliability.evaluation import evaluate_classifier, cohort_report

def test_selected_model_is_calibrated_and_beats_constant_baseline_brier():
    X,y,cohort=representative_dataset(700,seed=7); selected=choose_model(train_candidates(X[:500],y[:500]),X[500:],y[500:],cohort[500:]); m=evaluate_classifier(selected.model,X[500:],y[500:]); base=float(np.mean((np.full(len(y[500:]),y[:500].mean())-y[500:])**2)); assert m['brier']<base and 0<=selected.threshold<=1
def test_event_prediction_has_no_worker_label_and_requires_review_at_high_risk():
    X,y,cohort=representative_dataset(500,seed=8); selected=choose_model(train_candidates(X[:350],y[:350]),X[350:],y[350:],cohort[350:]); p=event_risk_prediction(selected,X[351],event_id='e99'); assert 'worker_label' not in p and p['event_id']=='e99' and p['requires_human_review']==(p['risk_probability']>=selected.threshold)
def test_cohort_report_exposes_calibration_and_recall_gap():
    X,y,cohort=representative_dataset(600,seed=9); selected=choose_model(train_candidates(X[:400],y[:400]),X[400:],y[400:],cohort[400:]); report=cohort_report(selected.model,X[400:],y[400:],cohort[400:],selected.threshold); assert 'max_recall_gap' in report and 'max_brier_gap' in report
def test_release_seed_selected_model_beats_constant_brier():
    X,y,cohort=representative_dataset(900,seed=19); selected=choose_model(train_candidates(X[:650],y[:650]),X[650:],y[650:],cohort[650:]); m=evaluate_classifier(selected.model,X[650:],y[650:]); base=float(np.mean((np.full(len(y[650:]),y[:650].mean())-y[650:])**2)); assert m['brier']<base
