from datetime import date,timedelta
from cashflow_forecaster.schemas import DailyCashflow
from cashflow_forecaster.model import fit_bundle, forecast
from cashflow_forecaster.backtest import backtest

def series(n=140):
    start=date(2026,1,1); rows=[]
    for i in range(n):
        seasonal=20 if i%7 in (4,5) else 0
        rows.append(DailyCashflow(date=start+timedelta(days=i),cash_in=150+seasonal+i*.3,cash_out=90+(i%7)*2))
    return rows

def test_backtest_uses_out_of_sample_origins_and_reports_interval_coverage():
    report=backtest(series(),horizon=7,min_train=56,step=7)
    assert report["folds"]>=8 and 0 <= report["net_interval_coverage"] <= 1 and report["mae_net"] >= 0

def test_forecast_intervals_are_ordered_and_net_is_derived():
    bundle=fit_bundle(series(),horizon=7); points=forecast(bundle,series(),7); assert len(points)==7
    for p in points:
        assert p.cash_in_low <= p.cash_in <= p.cash_in_high
        assert p.cash_out_low <= p.cash_out <= p.cash_out_high
        assert abs(p.net_cash-(p.cash_in-p.cash_out))<1e-9
        assert p.net_low <= p.net_cash <= p.net_high

def test_artifact_fingerprint_is_stable_and_present():
    b1=fit_bundle(series(),horizon=7); b2=fit_bundle(series(),horizon=7)
    assert b1.artifact_sha256==b2.artifact_sha256 and len(b1.artifact_sha256)==64
