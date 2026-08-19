from dataclasses import dataclass
import hashlib, json, numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from .features import vectorize, FEATURE_NAMES, hard_escalation
from .evaluation import evaluate_holdout

@dataclass
class RiskModelBundle:
    model: object
    metrics: dict
    train_campaigns: list[str]
    holdout_campaigns: list[str]
    train_count: int
    holdout_count: int
    threshold: float
    model_version: str
    artifact_sha256: str

def _fingerprint(model,threshold):
    est=model.calibrated_classifiers_[0].estimator if hasattr(model,'calibrated_classifiers_') else model
    try:
        lr=est.named_steps['lr']; payload={'coef':np.round(lr.coef_,12).tolist(),'intercept':np.round(lr.intercept_,12).tolist(),'threshold':threshold,'features':FEATURE_NAMES}
    except Exception:
        payload={'repr':repr(model),'threshold':threshold,'features':FEATURE_NAMES}
    return hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()

def train_risk_model(rows,seed=5,holdout_fraction=0.25,review_budget=0.1):
    campaign_dates={}
    for r in rows:
        campaign_dates[r.record.campaign_id]=min(campaign_dates.get(r.record.campaign_id,r.record.created_at),r.record.created_at)
    order=sorted(campaign_dates,key=lambda c:(campaign_dates[c],c))
    n_hold=max(1,int(round(len(order)*holdout_fraction))); hold=set(order[-n_hold:]); train=set(order[:-n_hold])
    train_rows=[r for r in rows if r.record.campaign_id in train]; hold_rows=[r for r in rows if r.record.campaign_id in hold]
    X=np.asarray([vectorize(r.record) for r in train_rows],float); y=np.asarray([r.label for r in train_rows])
    base=Pipeline([('scale',StandardScaler()),('lr',LogisticRegression(max_iter=1500,random_state=seed))])
    model=CalibratedClassifierCV(base,method='sigmoid',cv=3); model.fit(X,y)
    train_p=model.predict_proba(X)[:,1]; k=max(1,int(np.ceil(len(train_p)*review_budget))); threshold=float(np.partition(train_p,-k)[-k])
    Xh=np.asarray([vectorize(r.record) for r in hold_rows],float); yh=np.asarray([r.label for r in hold_rows]); sh=np.asarray([r.severe for r in hold_rows])
    ph=model.predict_proba(Xh)[:,1]; metrics=evaluate_holdout(yh,ph,sh,[hard_escalation(r.record) for r in hold_rows],review_budget)
    return RiskModelBundle(model,metrics,sorted(train),sorted(hold),len(train_rows),len(hold_rows),threshold,'fraud-risk-v1',_fingerprint(model,threshold))

def predict_probability(bundle,record):
    return float(bundle.model.predict_proba(np.asarray([vectorize(record)],float))[:,1][0])
