from fastapi import FastAPI,HTTPException
from .schemas import DocumentInput
from .parser import parse_document,parser_artifact_sha256
from .validation import validate_record
from .category_model import predict_category
def create_app(parser_configured=False,category_bundle=None,ruleset_version="rules-v1",data_version="fixture-v1"):
    app=FastAPI(title="Document Expense Intelligence")
    @app.get("/health/ready")
    def ready():
        if not parser_configured or category_bundle is None: raise HTTPException(503,"required parser/category artifacts not configured")
        return {"ready":True,"parser_version":"parser-v1","parser_artifact_sha256":parser_artifact_sha256(),"category_model_version":category_bundle.version,"category_artifact_sha256":category_bundle.artifact_sha256}
    @app.post("/extract")
    def extract(doc:DocumentInput):
        if not parser_configured or category_bundle is None: raise HTTPException(503,"required parser/category artifacts not configured")
        rec=validate_record(parse_document(doc)); label,conf=predict_category(category_bundle,doc.raw_text); rec.category.value=label; rec.category.confidence=conf; rec.category.source_text=label
        if conf<.60: rec.needs_review=True
        combined=__import__("hashlib").sha256((parser_artifact_sha256()+category_bundle.artifact_sha256).encode()).hexdigest()
        return {"record":rec.model_dump(),"parser_version":doc.parser_version,"artifact_sha256":combined,"parser_artifact_sha256":parser_artifact_sha256(),"category_model_version":category_bundle.version,"category_artifact_sha256":category_bundle.artifact_sha256,"ruleset_version":ruleset_version,"data_version":data_version,"disclaimer":"Low-confidence or conflicting financial fields require human review; the service does not silently correct source values."}
    return app
app=create_app()
