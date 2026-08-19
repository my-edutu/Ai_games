from datetime import date, timedelta
import pytest
from cashflow_forecaster.schemas import DailyCashflow
from cashflow_forecaster.dataset import validate_series, deterministic_hash
from cashflow_forecaster.backtest import rolling_origins

def series(n=90):
    start=date(2026,1,1)
    return [DailyCashflow(date=start+timedelta(days=i),cash_in=100+i%7*10,cash_out=60+i%5*5) for i in range(n)]

def test_negative_cash_values_rejected():
    with pytest.raises(Exception): DailyCashflow(date=date(2026,1,1),cash_in=-1,cash_out=0)

def test_duplicate_dates_rejected():
    s=series(3); s.append(s[-1])
    with pytest.raises(ValueError): validate_series(s)

def test_series_hash_is_deterministic():
    s=series(10); assert deterministic_hash(s)==deterministic_hash(s)

def test_rolling_origins_never_train_on_future():
    folds=rolling_origins(series(70),horizon=7,min_train=35,step=7); assert folds
    for train,test in folds:
        assert max(x.date for x in train) < min(x.date for x in test)
        assert len(test)==7
