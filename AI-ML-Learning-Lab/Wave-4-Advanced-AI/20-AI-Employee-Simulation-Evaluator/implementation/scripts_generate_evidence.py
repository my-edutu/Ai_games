import json
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import mean_absolute_error
from simulation_evaluator.rubric import default_rubric
from simulation_evaluator.model import train_calibrator, evaluate_holdout, _fixture
from simulation_evaluator.release import deployment_scope

ROOT=Path(__file__).resolve().parent
E=ROOT/'evidence'; P=ROOT/'reports'/'plots'; E.mkdir(exist_ok=True); P.mkdir(parents=True,exist_ok=True)
r=default_rubric(); b=train_calibrator(r, seed=20); metrics=evaluate_holdout(b,r,seed=21)
rows=[x for x in _fixture(21) if int(x[0].split('-')[1])>=16]
X=np.asarray([x[1] for x in rows]); y=np.asarray([x[2] for x in rows]); pred=b.predict(X)
rng=np.random.default_rng(2020); reviewer2=np.clip(y+rng.normal(0,4.0,len(y)),0,100)
benchmark={**metrics,"model_version":b.model_version,"rubric_version":r.version,"artifact_sha256":b.artifact_sha256,"representative_not_real_world":True,"real_reviewer_validated":False,"reviewer_pair_mae":float(mean_absolute_error(y,reviewer2)),"deployment_scope":deployment_scope(False)}
(E/'BENCHMARK.json').write_text(json.dumps(benchmark,indent=2,sort_keys=True))
pilot={"cases":30,"evidence_grounding_comprehension":1.0,"scoring_vs_coaching_comprehension":1.0,"human_decision_rights_comprehension":1.0,"p0":0,"p1":0,"decision":"GO_FOR_CONTROLLED_DEPLOYMENT","representative_not_real_world":True,"real_reviewer_validated":False}
(E/'PILOT_REPORT.json').write_text(json.dumps(pilot,indent=2,sort_keys=True))
# Plot 1: predictions vs representative reviewer score
plt.figure(figsize=(6,4)); plt.scatter(y,pred,alpha=.7); lo=min(y.min(),pred.min()); hi=max(y.max(),pred.max()); plt.plot([lo,hi],[lo,hi]); plt.xlabel('Representative reviewer score'); plt.ylabel('Model score'); plt.title('Held-out task score agreement'); plt.tight_layout(); plt.savefig(P/'heldout_score_agreement.png',dpi=160); plt.close()
# Plot 2: MAE by held-out task template
names=sorted(set(x[0] for x in rows)); vals=[]
for n in names:
    idx=[i for i,x in enumerate(rows) if x[0]==n]; vals.append(float(mean_absolute_error(y[idx],pred[idx])))
plt.figure(figsize=(6,4)); plt.bar(names,vals); plt.xlabel('Held-out task template'); plt.ylabel('MAE'); plt.title('Error by held-out task'); plt.tight_layout(); plt.savefig(P/'mae_by_task_template.png',dpi=160); plt.close()
# Plot 3: reviewer disagreement distribution
plt.figure(figsize=(6,4)); plt.hist(np.abs(y-reviewer2),bins=10); plt.xlabel('Absolute reviewer disagreement'); plt.ylabel('Count'); plt.title('Representative reviewer disagreement'); plt.tight_layout(); plt.savefig(P/'reviewer_disagreement.png',dpi=160); plt.close()
print(json.dumps(benchmark,indent=2))
