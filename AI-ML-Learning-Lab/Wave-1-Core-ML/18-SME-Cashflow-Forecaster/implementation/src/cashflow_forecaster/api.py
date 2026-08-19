from fastapi import FastAPI,HTTPException
from .schemas import ForecastRequest
from .model import forecast
from .scenario import apply_scenario
def create_app(bundle=None,data_version="unconfigured",scenario_policy_version="scenario-v1"):
    app=FastAPI(title="SME Cashflow Forecaster")
    @app.get("/health/ready")
    def ready():
        if bundle is None: raise HTTPException(503,"forecast artifact not configured")
        return {"ready":True,"model_version":bundle.model_version,"artifact_sha256":bundle.artifact_sha256}
    @app.post("/forecast")
    def run(req:ForecastRequest):
        if bundle is None: raise HTTPException(503,"forecast artifact not configured")
        base=forecast(bundle,req.history,req.horizon_days)
        sc=req.scenario
        scenario=None if sc is None else apply_scenario(base,sc.cash_in_multiplier,sc.cash_out_multiplier)
        return {"base_forecast":[p.model_dump(mode="json") for p in base],"scenario_forecast":None if scenario is None else [p.model_dump(mode="json") for p in scenario],"model_version":bundle.model_version,"model_artifact_sha256":bundle.artifact_sha256,"training_data_hash":bundle.training_data_hash,"data_version":data_version,"scenario_policy_version":scenario_policy_version,"disclaimer":"Forecasts are probabilistic estimates and are not guaranteed financial outcomes."}
    return app
app=create_app()
