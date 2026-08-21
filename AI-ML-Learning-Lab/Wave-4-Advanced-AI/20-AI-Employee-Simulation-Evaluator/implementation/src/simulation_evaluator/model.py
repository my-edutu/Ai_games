from __future__ import annotations
from dataclasses import dataclass
import hashlib, json
import numpy as np
from scipy.stats import spearmanr
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from .scoring import extract_features

@dataclass
class ModelBundle:
    model: object
    rubric_version: str
    model_version: str
    artifact_sha256: str
    def predict(self, rows):
        return self.model.predict(np.asarray(rows, dtype=float))


def _fixture(seed: int = 20, n_templates: int = 20, per_template: int = 18):
    rng = np.random.default_rng(seed)
    rows=[]
    for t in range(n_templates):
        template = f"task-{t:02d}"
        difficulty = rng.uniform(-6, 6)
        for i in range(per_template):
            analysis=float(rng.beta(2.4,2.0)); decision=float(rng.beta(2.2,2.0)); evidence=float(rng.beta(2.0,2.4)); measurement=float(rng.beta(2.2,2.2)); risk=float(rng.beta(2.1,2.3)); linked=float(rng.uniform(.3,1)); rationale=float(rng.uniform(.4,1))
            feat=[analysis,decision,evidence,measurement,risk,linked,rationale]
            y=100*(.25*analysis+.22*decision+.18*evidence+.13*measurement+.12*risk+.06*linked+.04*rationale)+difficulty+rng.normal(0,3.2)
            rows.append((template,feat,float(np.clip(y,0,100))))
    return rows


def train_calibrator(rubric, seed: int = 20) -> ModelBundle:
    rows=_fixture(seed)
    train=[r for r in rows if int(r[0].split('-')[1]) < 16]
    X=np.asarray([r[1] for r in train]); y=np.asarray([r[2] for r in train])
    model=Ridge(alpha=2.0).fit(X,y)
    payload={"coef":model.coef_.round(12).tolist(),"intercept":round(float(model.intercept_),12),"rubric_version":rubric.version,"model_version":"sim-evaluator-v1"}
    sha=hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
    return ModelBundle(model=model,rubric_version=rubric.version,model_version="sim-evaluator-v1",artifact_sha256=sha)


def evaluate_holdout(bundle: ModelBundle, rubric, seed: int = 21) -> dict:
    # Different seed, same task-family partition: templates 16-19 are sealed from fitting.
    rows=_fixture(seed)
    test=[r for r in rows if int(r[0].split('-')[1]) >= 16]
    X=np.asarray([r[1] for r in test]); y=np.asarray([r[2] for r in test])
    p=bundle.predict(X)
    base=np.full_like(y,y.mean())
    rho=float(spearmanr(y,p).statistic)
    return {"mae":float(mean_absolute_error(y,p)),"constant_baseline_mae":float(mean_absolute_error(y,base)),"spearman":rho,"held_out_task_templates":4,"holdout_count":len(y)}
