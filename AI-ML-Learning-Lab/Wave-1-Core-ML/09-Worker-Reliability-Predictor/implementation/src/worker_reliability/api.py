from fastapi import FastAPI
from .schemas import PredictionRequest
from .features import build_event_features, vectorize
from .synthetic import representative_dataset
from .model import train_candidates, choose_model, event_risk_prediction
from .robustness import should_abstain

_MODEL=None

def _default_model():
    global _MODEL
    if _MODEL is None:
        X,y,c=representative_dataset(450,seed=44); _MODEL=choose_model(train_candidates(X[:320],y[:320]),X[320:],y[320:],c[320:])
    return _MODEL

def create_app():
    app=FastAPI(title='Worker Reliability Event Risk Support',version='1.0')
    @app.post('/v1/event-risk')
    def predict(req:PredictionRequest):
        f=build_event_features(req.worker,req.event,req.history,cutoff=req.event.starts_at); selected=_default_model(); pred=event_risk_prediction(selected,vectorize(f),req.event.event_id)
        prior=[h for h in req.history if h.occurred_at < req.event.starts_at]; data_age=max(0,(req.event.starts_at-max(h.occurred_at for h in prior)).days) if prior else 999
        pred['abstain']=should_abstain(int(f['history_count']),data_age,pred['risk_probability']); pred['appeal_url']='/v1/corrections-and-appeals'; pred['policy_version']='restricted-use-v1'; pred['data_version']='event-history-v1'; pred['disclaimer']='Event-level estimate only; not a persistent worker reliability score and not grounds for autonomous adverse action.'
        return pred
    return app
