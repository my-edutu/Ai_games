from fastapi import FastAPI,HTTPException
from .schemas import ReviewRequest,RewriteRequest
from .review import review_application
from .rewrite import rewrite_application
from .model import predict_scores
def create_app(bundle=None,rubric_version="unconfigured",prompt_version="unconfigured",data_version="representative-v1"):
    app=FastAPI(title="Application Quality Coach")
    @app.get("/health/ready")
    def ready():
        if bundle is None: raise HTTPException(503,"evaluation artifact not configured")
        return {"ready":True,"model_version":bundle.model_version,"model_artifact_sha256":bundle.artifact_sha256,"rubric_version":rubric_version,"prompt_version":prompt_version,"data_version":data_version}
    @app.post("/review")
    def review(req:ReviewRequest):
        if bundle is None: raise HTTPException(503,"evaluation artifact not configured")
        result=review_application(req); calibrated=predict_scores(bundle,req.application_text,req.opportunity_criteria); body=result.model_dump(mode="json"); body["baseline_score"]=result.overall_score; body["overall_score"]=round(calibrated,2); body.update({"model_version":bundle.model_version,"model_artifact_sha256":bundle.artifact_sha256,"rubric_version":rubric_version,"prompt_version":prompt_version,"data_version":data_version}); return body
    @app.post("/rewrite")
    def rewrite(req:RewriteRequest):
        if bundle is None: raise HTTPException(503,"evaluation artifact not configured")
        out=rewrite_application(req); return {**out.model_dump(mode="json"),"model_version":bundle.model_version,"model_artifact_sha256":bundle.artifact_sha256,"prompt_version":prompt_version,"disclaimer":"Rewrite preserves supplied facts; verify the final text before submission."}
    return app
app=create_app()
