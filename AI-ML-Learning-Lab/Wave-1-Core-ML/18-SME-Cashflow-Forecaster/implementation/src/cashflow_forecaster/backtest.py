import numpy as np
from sklearn.metrics import mean_absolute_error
def rolling_origins(rows,horizon=7,min_train=35,step=7):
    folds=[]
    stop=len(rows)-horizon
    for end in range(min_train,stop+1,step):
        folds.append((rows[:end],rows[end:end+horizon]))
    return folds
def _weekday_means(rows,field):
    vals={i:[] for i in range(7)}
    for r in rows: vals[r.date.weekday()].append(getattr(r,field))
    overall=np.mean([getattr(r,field) for r in rows])
    return {k:(float(np.mean(v)) if v else float(overall)) for k,v in vals.items()}
def point_forecast(train,future_dates):
    inc=_weekday_means(train,"cash_in"); out=_weekday_means(train,"cash_out")
    n=min(28,len(train)); x=np.arange(n)
    cin=np.array([r.cash_in for r in train[-n:]],dtype=float); cout=np.array([r.cash_out for r in train[-n:]],dtype=float)
    sin=float(np.polyfit(x,cin,1)[0]) if n>=2 else 0.; sout=float(np.polyfit(x,cout,1)[0]) if n>=2 else 0.
    cap_in=max(1.,np.mean(cin)*.05); cap_out=max(1.,np.mean(cout)*.05)
    sin=float(np.clip(sin,-cap_in,cap_in)); sout=float(np.clip(sout,-cap_out,cap_out))
    return [(max(0.,inc[d.weekday()]+sin*(i+1)),max(0.,out[d.weekday()]+sout*(i+1))) for i,d in enumerate(future_dates)]
def backtest_residuals(rows,horizon=7,min_train=35,step=7):
    rin=[]; rout=[]; actual_net=[]; pred_net=[]
    for train,test in rolling_origins(rows,horizon,min_train,step):
        pred=point_forecast(train,[r.date for r in test])
        for (pi,po),a in zip(pred,test):
            rin.append(a.cash_in-pi); rout.append(a.cash_out-po); actual_net.append(a.cash_in-a.cash_out); pred_net.append(pi-po)
    return np.array(rin),np.array(rout),np.array(actual_net),np.array(pred_net)
def backtest(rows,horizon=7,min_train=35,step=7):
    ri,ro,an,pn=backtest_residuals(rows,horizon,min_train,step)
    if len(ri)==0: raise ValueError("insufficient rows for backtest")
    net_res=an-pn; lo,hi=np.quantile(net_res,[.1,.9]); coverage=float(np.mean((an>=pn+lo)&(an<=pn+hi)))
    return {"folds":len(rolling_origins(rows,horizon,min_train,step)),"mae_cash_in":float(np.mean(np.abs(ri))),"mae_cash_out":float(np.mean(np.abs(ro))),"mae_net":float(mean_absolute_error(an,pn)),"net_interval_coverage":coverage}
