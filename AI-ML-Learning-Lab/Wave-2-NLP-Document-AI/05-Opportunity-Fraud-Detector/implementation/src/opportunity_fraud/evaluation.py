import numpy as np
from sklearn.metrics import brier_score_loss, average_precision_score

def precision_at_budget(y,p,budget=0.2):
    n=max(1,int(np.ceil(len(y)*budget)))
    idx=np.argsort(-p)[:n]
    return float(np.mean(np.asarray(y)[idx]))

def recall_severe_at_budget(severe,p,budget=0.2):
    severe=np.asarray(severe); n=max(1,int(np.ceil(len(severe)*budget)))
    idx=set(np.argsort(-p)[:n].tolist()); positives=np.where(severe==1)[0]
    if not len(positives): return 1.0
    return float(sum(int(i) in idx for i in positives)/len(positives))

def evaluate_holdout(y,p,severe,hard_flags=None,budget=0.1):
    y=np.asarray(y); p=np.asarray(p); severe=np.asarray(severe); base=np.full(len(y),float(y.mean()))
    n=max(1,int(np.ceil(len(y)*budget))); top=set(np.argsort(-p)[:n].tolist())
    hard_flags=np.zeros(len(y),dtype=bool) if hard_flags is None else np.asarray(hard_flags,dtype=bool)
    reviewed=np.asarray([i in top or hard_flags[i] for i in range(len(y))])
    severe_pos=severe==1
    return {'evaluation_scope':'held_out_campaigns','positive_rate':float(y.mean()),'brier':float(brier_score_loss(y,p)),'constant_baseline_brier':float(brier_score_loss(y,base)),'pr_auc':float(average_precision_score(y,p)),'precision_at_review_budget':precision_at_budget(y,p,budget),'precision_review_queue':float(y[reviewed].mean()) if reviewed.any() else 0.0,'severe_recall_review_queue':float(reviewed[severe_pos].mean()) if severe_pos.any() else 1.0,'effective_review_fraction':float(reviewed.mean()),'review_budget':budget}
