from dataclasses import dataclass
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from .evaluation import evaluate_classifier, cohort_report

@dataclass
class CandidateBundle: models: dict
@dataclass
class SelectedModel:
    name: str
    model: object
    threshold: float
    model_version: str='risk-v1'

def train_candidates(X,y):
    logistic=make_pipeline(StandardScaler(),LogisticRegression(max_iter=800,class_weight=None,random_state=7)); logistic.fit(X,y)
    tree=HistGradientBoostingClassifier(max_depth=3,learning_rate=.06,max_iter=120,random_state=7); calibrated_tree=CalibratedClassifierCV(tree,method='sigmoid',cv=3); calibrated_tree.fit(X,y)
    return CandidateBundle({'logistic':logistic,'calibrated_tree':calibrated_tree})

def _choose_threshold(model,X,y,cohort):
    p=model.predict_proba(X)[:,1]; best=(.5,-1e9)
    for t in np.linspace(.25,.75,21):
        pred=(p>=t).astype(int); tp=((pred==1)&(y==1)).sum(); fp=((pred==1)&(y==0)).sum(); fn=((pred==0)&(y==1)).sum(); recall=tp/max(1,tp+fn); precision=tp/max(1,tp+fp); report=cohort_report(model,X,y,cohort,float(t)); score=2*recall+precision-0.7*report['max_recall_gap']
        if score>best[1]: best=(float(t),score)
    return best[0]

def choose_model(bundle,X,y,cohort):
    scored=[]
    for name,m in bundle.models.items():
        metrics=evaluate_classifier(m,X,y); t=_choose_threshold(m,X,y,cohort); fairness=cohort_report(m,X,y,cohort,t); utility=metrics['pr_auc']-metrics['brier']-.25*fairness['max_recall_gap']; scored.append((utility,name,m,t))
    _,name,m,t=max(scored,key=lambda x:x[0]); return SelectedModel(name,m,t)

def event_risk_prediction(selected,row,event_id):
    p=float(selected.model.predict_proba(np.asarray(row).reshape(1,-1))[0,1])
    return {'event_id':event_id,'risk_probability':p,'requires_human_review':bool(p>=selected.threshold),'threshold':selected.threshold,'model_version':selected.model_version,'reason_codes':['recent_operational_history','event_context'],'decision_authority':'human_review_required_for_adverse_action'}
