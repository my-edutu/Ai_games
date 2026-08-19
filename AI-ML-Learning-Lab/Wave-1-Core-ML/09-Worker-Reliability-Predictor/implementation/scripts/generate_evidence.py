import json
from pathlib import Path
import numpy as np
from worker_reliability.synthetic import representative_dataset
from worker_reliability.model import train_candidates, choose_model
from worker_reliability.evaluation import evaluate_classifier, cohort_report
from worker_reliability.pilot import run_representative_pilot
root=Path(__file__).resolve().parents[1]; X,y,c=representative_dataset(900,seed=19); sel=choose_model(train_candidates(X[:650],y[:650]),X[650:],y[650:],c[650:]); metrics=evaluate_classifier(sel.model,X[650:],y[650:]); report=cohort_report(sel.model,X[650:],y[650:],c[650:],sel.threshold); base=float(np.mean((np.full(len(y[650:]),y[:650].mean())-y[650:])**2)); bench={'selected_model':sel.name,'model_version':sel.model_version,'threshold':sel.threshold,'brier':metrics['brier'],'pr_auc':metrics['pr_auc'],'constant_baseline_brier':base,'max_recall_gap':report['max_recall_gap'],'max_brier_gap':report['max_brier_gap'],'representative_not_real_world':True}; (root/'evidence'/'BENCHMARK.json').write_text(json.dumps(bench,indent=2,sort_keys=True)); (root/'evidence'/'PILOT_REPORT.json').write_text(json.dumps(run_representative_pilot(),indent=2,sort_keys=True)); print(json.dumps(bench,sort_keys=True))
