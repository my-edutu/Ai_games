from __future__ import annotations
from datetime import date
from fastapi import FastAPI
from pydantic import BaseModel
from .schemas import Applicant, ScholarshipPolicy, EligibilityDecision, EligibilityStatus
from .policy import evaluate_eligibility
from .robustness import SuitabilityResult, score_suitability

class EvaluateRequest(BaseModel):
    applicant: Applicant
    policy: ScholarshipPolicy
    include_suitability: bool = False
    as_of: date | None = None

class EvaluateResponse(BaseModel):
    eligibility: EligibilityDecision
    suitability: SuitabilityResult | None
    policy_version: str
    model_version: str | None

def create_app(model=None) -> FastAPI:
    app = FastAPI(title='Scholarship Eligibility Predictor', version='1.0.0')
    @app.post('/v1/evaluate', response_model=EvaluateResponse)
    def evaluate(req: EvaluateRequest):
        eligibility = evaluate_eligibility(req.applicant, req.policy, as_of=req.as_of)
        suitability = None
        model_version = None
        if req.include_suitability and model is not None and eligibility.status is not EligibilityStatus.INELIGIBLE:
            suitability = score_suitability(model, req.applicant)
            model_version = suitability.model_version
        return EvaluateResponse(
            eligibility=eligibility,
            suitability=suitability,
            policy_version=req.policy.version,
            model_version=model_version,
        )
    @app.get('/health')
    def health():
        return {'status': 'ok'}
    return app
