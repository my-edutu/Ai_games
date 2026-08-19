from .schemas import ForecastPoint
def apply_scenario(points,cash_in_multiplier=1.0,cash_out_multiplier=1.0):
    out=[]
    for p in points:
        ci=p.cash_in*cash_in_multiplier; co=p.cash_out*cash_out_multiplier
        cil=p.cash_in_low*cash_in_multiplier; cih=p.cash_in_high*cash_in_multiplier
        col=p.cash_out_low*cash_out_multiplier; coh=p.cash_out_high*cash_out_multiplier
        out.append(ForecastPoint(date=p.date,cash_in=ci,cash_in_low=cil,cash_in_high=cih,cash_out=co,cash_out_low=col,cash_out_high=coh,net_cash=ci-co,net_low=cil-coh,net_high=cih-col))
    return out
