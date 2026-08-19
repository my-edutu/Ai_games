import numpy as np
from sklearn.metrics import brier_score_loss, average_precision_score
def evaluate_predictions(y,p):
    return {"brier":float(brier_score_loss(y,p)),"pr_auc":float(average_precision_score(y,p))}
def cohort_report(y,p,groups,threshold=.4):
    out={}
    for g in np.unique(groups):
        m=groups==g
        yp=(p[m]>=threshold).astype(int)
        pos=max(1,(y[m]==1).sum())
        recall=float(((yp==1)&(y[m]==1)).sum()/pos)
        out[str(g)]={"brier":float(brier_score_loss(y[m],p[m])),"recall":recall}
    return out
