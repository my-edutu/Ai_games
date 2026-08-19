from datetime import date,timedelta
import numpy as np
from .schemas import DailyCashflow
def make_representative_series(n=220,seed=18):
    rng=np.random.default_rng(seed); start=date(2026,1,1); rows=[]
    for i in range(n):
        weekday=(start+timedelta(days=i)).weekday(); season_in=45 if weekday in (4,5) else 0; season_out=22 if weekday in (0,1) else 0; trend=.35*i
        cash_in=max(0.,180+season_in+trend+rng.normal(0,18)); cash_out=max(0.,120+season_out+.18*i+rng.normal(0,12))
        rows.append(DailyCashflow(date=start+timedelta(days=i),cash_in=float(cash_in),cash_out=float(cash_out)))
    return rows
