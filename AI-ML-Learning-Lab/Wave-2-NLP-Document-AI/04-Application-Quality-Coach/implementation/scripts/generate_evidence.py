from pathlib import Path
import json
from application_coach.synthetic import make_reviewer_dataset
from application_coach.model import train_calibrator
from application_coach.pilot import representative_pilot
root=Path(__file__).resolve().parents[1]; out=root/"evidence"; b=train_calibrator(make_reviewer_dataset(400,seed=19),seed=19)
report={"model_version":b.model_version,"artifact_sha256":b.artifact_sha256,"train_count":b.train_count,"holdout_count":b.holdout_count,**b.metrics,"representative_not_real_world":True}
(out/"BENCHMARK.json").write_text(json.dumps(report,indent=2,sort_keys=True)); (out/"PILOT_REPORT.json").write_text(json.dumps(representative_pilot(30),indent=2,sort_keys=True)); print(json.dumps(report,indent=2))
