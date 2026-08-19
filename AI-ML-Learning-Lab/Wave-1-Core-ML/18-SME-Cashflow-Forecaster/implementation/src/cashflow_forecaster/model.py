from dataclasses import dataclass
from datetime import timedelta
import hashlib,json,numpy as np
from .dataset import validate_series,deterministic_hash
from .backtest import point_forecast,backtest_residuals
from .schemas import ForecastPoint
@dataclass
class ForecastBundle:
    residual_in_q: tuple
    residual_out_q: tuple
    residual_in_median: float
    residual_out_median: float
    horizon_days: int
    model_version: str
    artifact_sha256: str
    training_data_hash: str
def fit_bundle(rows,horizon=7):
    validate_series(rows)
    ri,ro,_,_=backtest_residuals(rows,horizon,min_train=max(28,min(56,len(rows)//2)),step=max(1,horizon))
    if len(ri)<10: raise ValueError("insufficient backtest residuals")
    qi=tuple(float(x) for x in np.quantile(ri,[.1,.9])); qo=tuple(float(x) for x in np.quantile(ro,[.1,.9]))
    mi=float(np.median(ri)); mo=float(np.median(ro)); data_hash=deterministic_hash(rows)
    payload={"qi":qi,"qo":qo,"mi":mi,"mo":mo,"horizon":horizon,"data_hash":data_hash,"version":"cashflow-seasonal-v1"}
    sha=hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
    return ForecastBundle(qi,qo,mi,mo,horizon,"cashflow-seasonal-v1",sha,data_hash)
def forecast(bundle,rows,horizon):
    validate_series(rows)
    last=rows[-1].date; dates=[last+timedelta(days=i) for i in range(1,horizon+1)]
    raw=point_forecast(rows,dates); out=[]; li,ui=bundle.residual_in_q; lo,uo=bundle.residual_out_q
    for d,(raw_ci,raw_co) in zip(dates,raw):
        ci=max(0.,raw_ci+bundle.residual_in_median); co=max(0.,raw_co+bundle.residual_out_median)
        cil=max(0.,raw_ci+li); cih=max(cil,raw_ci+ui); col=max(0.,raw_co+lo); coh=max(col,raw_co+uo)
        out.append(ForecastPoint(date=d,cash_in=ci,cash_in_low=cil,cash_in_high=cih,cash_out=co,cash_out_low=col,cash_out_high=coh,net_cash=ci-co,net_low=cil-coh,net_high=cih-col))
    return out
