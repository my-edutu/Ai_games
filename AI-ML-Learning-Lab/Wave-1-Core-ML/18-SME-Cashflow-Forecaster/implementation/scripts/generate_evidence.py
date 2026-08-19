import json
from pathlib import Path
from cashflow_forecaster.synthetic import make_representative_series
from cashflow_forecaster.backtest import backtest
from cashflow_forecaster.model import fit_bundle
from cashflow_forecaster.pilot import representative_pilot
root=Path(__file__).resolve().parents[1]/"evidence"; root.mkdir(exist_ok=True)
rows=make_representative_series(); report=backtest(rows,horizon=7,min_train=56,step=7); bundle=fit_bundle(rows,7)
report.update({"model_version":bundle.model_version,"artifact_sha256":bundle.artifact_sha256,"training_data_hash":bundle.training_data_hash,"representative_not_real_world":True})
(root/"BACKTEST_REPORT.json").write_text(json.dumps(report,indent=2,sort_keys=True)); (root/"PILOT_REPORT.json").write_text(json.dumps(representative_pilot(),indent=2,sort_keys=True))
print(json.dumps(report,sort_keys=True))
