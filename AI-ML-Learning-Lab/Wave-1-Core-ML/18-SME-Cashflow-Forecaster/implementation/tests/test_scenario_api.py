from datetime import date,timedelta
from fastapi.testclient import TestClient
from cashflow_forecaster.schemas import DailyCashflow
from cashflow_forecaster.model import fit_bundle, forecast
from cashflow_forecaster.scenario import apply_scenario
from cashflow_forecaster.api import create_app

def series(n=100):
    start=date(2026,1,1)
    return [DailyCashflow(date=start+timedelta(days=i),cash_in=120+(i%7)*8,cash_out=75+(i%5)*4) for i in range(n)]

def payload():
    return {"history":[{"date":x.date.isoformat(),"cash_in":x.cash_in,"cash_out":x.cash_out} for x in series()],"horizon_days":7,"scenario":{"cash_in_multiplier":0.8,"cash_out_multiplier":1.1}}

def test_scenario_is_separate_transform_and_preserves_base():
    b=fit_bundle(series(),7); base=forecast(b,series(),7); stressed=apply_scenario(base,.8,1.1)
    assert stressed[0].cash_in < base[0].cash_in and stressed[0].cash_out > base[0].cash_out

def test_api_fails_closed_without_model():
    c=TestClient(create_app()); assert c.get("/health/ready").status_code==503; assert c.post("/forecast",json=payload()).status_code==503

def test_api_returns_uncertainty_versions_and_no_guarantee_language():
    b=fit_bundle(series(),7); c=TestClient(create_app(b,data_version="fixture-v1")); r=c.post("/forecast",json=payload()); assert r.status_code==200
    body=r.json(); assert body["model_artifact_sha256"]==b.artifact_sha256; assert body["model_version"]==b.model_version
    assert "not guaranteed" in body["disclaimer"].lower(); assert len(body["base_forecast"])==7 and len(body["scenario_forecast"])==7
