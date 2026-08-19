import numpy as np
from sklearn.metrics import brier_score_loss, average_precision_score, recall_score

def evaluate_classifier(model,X,y):
    p=model.predict_proba(X)[:,1]
    return {'brier':float(brier_score_loss(y,p)),'pr_auc':float(average_precision_score(y,p))}

def cohort_report(model,X,y,cohort,threshold):
    p=model.predict_proba(X)[:,1]; groups=sorted(set(cohort.tolist() if hasattr(cohort,'tolist') else cohort)); rec=[]; bri=[]; details={}
    for g in groups:
        mask=np.asarray(cohort)==g; yy=np.asarray(y)[mask]; pp=p[mask]; pred=(pp>=threshold).astype(int)
        r=float(recall_score(yy,pred,zero_division=0)); b=float(brier_score_loss(yy,pp)); rec.append(r); bri.append(b); details[g]={'recall':r,'brier':b,'n':int(mask.sum())}
    return {'cohorts':details,'max_recall_gap':float(max(rec)-min(rec)) if rec else 0.0,'max_brier_gap':float(max(bri)-min(bri)) if bri else 0.0}
