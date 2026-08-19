import numpy as np
from dataclasses import dataclass
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, average_precision_score

@dataclass
class ModelBundle:
    model: object
    metrics: dict
    model_version: str="noshow-logistic-v1"

def train_candidates(X,y,seed=13):
    model=LogisticRegression(max_iter=1000,random_state=seed)
    model.fit(X,y)
    pred=model.predict_proba(X)[:,1]
    base=np.full(len(y),float(np.mean(y)))
    metrics={"brier":float(brier_score_loss(y,pred)),
             "constant_baseline_brier":float(brier_score_loss(y,base)),
             "pr_auc":float(average_precision_score(y,pred))}
    return ModelBundle(model,metrics)

def select_threshold(bundle,X,y,groups):
    pred=bundle.model.predict_proba(X)[:,1]
    best=(1e9,0.4)
    for t in np.arange(.2,.71,.05):
        errs=[]
        for g in np.unique(groups):
            mask=groups==g
            if mask.sum():
                yp=(pred[mask]>=t).astype(int)
                fn=((yp==0)&(y[mask]==1)).sum()
                pos=max(1,(y[mask]==1).sum())
                errs.append(fn/pos)
        gap=max(errs)-min(errs) if errs else 0
        cost=gap + abs(t-.4)*.05
        if cost<best[0]: best=(cost,float(round(t,2)))
    return best[1]

def predict_risk(bundle,features):
    vals=np.array([[features[k] for k in ["lead_time_days","prior_no_show_rate","history_count","transport_barrier","reminder_opt_in","clinic_code"]]])
    return float(bundle.model.predict_proba(vals)[:,1][0])
