from fastapi import FastAPI, HTTPException
from .scoring import score_submission
from .schemas import Submission


def create_app(model_bundle=None, rubric=None):
    app = FastAPI(title="AI Employee Simulation Evaluator")
    def compatible():
        return model_bundle is not None and rubric is not None and model_bundle.rubric_version == rubric.version
    @app.get("/health/ready")
    def ready():
        if not compatible():
            raise HTTPException(503, "model/rubric artifact not configured or version mismatch")
        return {"ready": True, "model_version": model_bundle.model_version, "rubric_version": rubric.version, "artifact_sha256": model_bundle.artifact_sha256}
    @app.post("/score")
    def score(payload: Submission):
        payload=payload.model_dump()
        if not compatible():
            raise HTTPException(503, "model/rubric artifact not configured or version mismatch")
        baseline=score_submission(payload, rubric)
        substantive=len({c["artifact_id"] for c in baseline["citations"]}) >= 1 and len(payload.get("decisions", [])) >= 1
        if not substantive:
            return {"overall_score":None,"abstained":True,"human_decision_required":True,"human_review_required":True,"reason":"insufficient_observable_evidence","rubric_version":rubric.version,"model_version":model_bundle.model_version,"artifact_sha256":model_bundle.artifact_sha256}
        result=score_submission(payload, rubric, model_bundle=model_bundle)
        result.update({"abstained":False,"human_review_required":True,"model_version":model_bundle.model_version,"artifact_sha256":model_bundle.artifact_sha256})
        return result
    @app.post("/coach")
    def coach(payload: Submission):
        payload=payload.model_dump()
        if not compatible():
            raise HTTPException(503, "model/rubric artifact not configured or version mismatch")
        scored=score_submission(payload, rubric)
        weakest=sorted(scored["dimension_scores"], key=scored["dimension_scores"].get)[:2]
        return {"coaching":[f"Add observable evidence for {d.replace('_',' ')}." for d in weakest],"rubric_version":rubric.version,"human_decision_required":True}
    return app
