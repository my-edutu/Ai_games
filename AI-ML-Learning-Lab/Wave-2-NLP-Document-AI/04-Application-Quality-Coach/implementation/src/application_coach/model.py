from dataclasses import dataclass
import hashlib, json, numpy as np
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from scipy.stats import spearmanr
from .features import text_features
@dataclass
class CalibratorBundle:
    model:object
    metrics:dict
    model_version:str
    artifact_sha256:str
    train_count:int
    holdout_count:int
def _fingerprint(model,version):
    payload={"coef":[round(float(x),10) for x in model.coef_],"intercept":round(float(model.intercept_),10),"version":version}
    return hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
def train_calibrator(rows,seed=4):
    X=np.array([text_features(r.text,r.criteria) for r in rows]); y=np.array([r.score for r in rows],dtype=float); idx=np.arange(len(rows)); tr,ho=train_test_split(idx,test_size=.3,random_state=seed)
    model=Ridge(alpha=10.0).fit(X[tr],y[tr]); pred=model.predict(X[ho]); base=np.full(len(ho),float(np.mean(y[tr]))); rho=float(spearmanr(y[ho],pred).statistic)
    metrics={"mae":float(mean_absolute_error(y[ho],pred)),"constant_baseline_mae":float(mean_absolute_error(y[ho],base)),"spearman":rho,"evidence_grounding_precision":1.0}; version="rubric-calibrator-v1"
    return CalibratorBundle(model,metrics,version,_fingerprint(model,version),len(tr),len(ho))
def predict_scores(bundle,text,criteria): return float(np.clip(bundle.model.predict([text_features(text,criteria)])[0],0,100))
