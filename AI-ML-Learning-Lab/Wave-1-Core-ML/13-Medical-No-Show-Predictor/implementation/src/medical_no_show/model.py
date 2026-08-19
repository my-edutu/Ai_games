from __future__ import annotations
import hashlib, json
from dataclasses import dataclass
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, average_precision_score
from sklearn.model_selection import train_test_split

@dataclass
class ModelBundle:
    model: object
    metrics: dict
    threshold: float
    model_version: str
    artifact_sha256: str

def _fingerprint(model):
    payload={"coef":model.coef_.round(12).tolist(),"intercept":model.intercept_.round(12).tolist(),"classes":model.classes_.tolist()}
    return hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()

def train_evaluate(X,y,groups,seed=13):
    idx=np.arange(len(y))
    train_idx,test_idx=train_test_split(idx,test_size=.30,random_state=seed,stratify=y)
    model=LogisticRegression(max_iter=1000,random_state=seed).fit(X[train_idx],y[train_idx])
    pred=model.predict_proba(X[test_idx])[:,1]
    base=np.full(len(test_idx),float(np.mean(y[train_idx])))
    metrics={"brier":float(brier_score_loss(y[test_idx],pred)),"constant_baseline_brier":float(brier_score_loss(y[test_idx],base)),"pr_auc":float(average_precision_score(y[test_idx],pred)),"train_size":int(len(train_idx)),"holdout_size":int(len(test_idx))}
    return ModelBundle(model,metrics,.6,"noshow-logistic-v2",_fingerprint(model)), test_idx

def train_candidates(X,y,seed=13):
    groups=np.array(["all"]*len(y))
    bundle,_=train_evaluate(X,y,groups,seed)
    return bundle

def select_threshold(bundle,X,y,groups):
    return bundle.threshold

def predict_risk(bundle,features):
    keys=["lead_time_days","prior_no_show_rate","history_count","transport_barrier","reminder_opt_in","clinic_code"]
    x=np.array([[features[k] for k in keys]],dtype=float)
    return float(bundle.model.predict_proba(x)[:,1][0])
