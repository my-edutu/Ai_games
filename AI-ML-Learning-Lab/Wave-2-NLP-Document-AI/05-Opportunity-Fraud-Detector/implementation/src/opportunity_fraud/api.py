from fastapi import FastAPI, HTTPException
from .schemas import ReviewRequest
from .model import predict_probability
from .features import evidence_codes, hard_escalation
from .robustness import should_escalate

def create_app(bundle=None,data_version='unconfigured',threat_policy_version='unconfigured'):
    app=FastAPI(title='Opportunity Risk Review')
    @app.get('/health/ready')
    def ready():
        if bundle is None: raise HTTPException(503,'risk model artifact not configured')
        return {'ready':True,'model_version':bundle.model_version,'artifact_sha256':bundle.artifact_sha256,'data_version':data_version,'threat_policy_version':threat_policy_version}
    @app.post('/review')
    def review(req: ReviewRequest):
        if bundle is None: raise HTTPException(503,'risk model artifact not configured')
        p=predict_probability(bundle,req.opportunity)
        ev=[{'code':c,'detail':d,'severity':s} for c,d,s in evidence_codes(req.opportunity)]
        hard=hard_escalation(req.opportunity)
        band='high' if (p>=bundle.threshold or hard) else ('medium' if p>=0.25 else 'low')
        return {'opportunity_id':req.opportunity.opportunity_id,'risk_probability':p,'risk_band':band,'evidence':ev,'review_required':bool(hard or should_escalate(p,bundle.threshold)),'legal_conclusion':False,'model_version':bundle.model_version,'artifact_sha256':bundle.artifact_sha256,'threat_policy_version':threat_policy_version,'data_version':data_version,'disclaimer':'This is risk evidence for human review, not a finding of fraud or criminality.'}
    return app
app=create_app()
