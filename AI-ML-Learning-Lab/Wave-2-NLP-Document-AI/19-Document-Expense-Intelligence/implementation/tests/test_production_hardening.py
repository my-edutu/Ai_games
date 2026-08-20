from fastapi.testclient import TestClient
from expense_intel.api import create_app
from expense_intel.category_synthetic import category_dataset
from expense_intel.category_model import train_category_model,predict_category
def bundle():
    X,y=category_dataset(); return train_category_model(X,y)
def test_readiness_fails_closed_without_both_artifacts(): assert TestClient(create_app(True,None)).get("/health/ready").status_code==503
def test_api_category_matches_evaluated_bundle():
    b=bundle(); c=TestClient(create_app(True,b)); payload={"document_id":"d","vendor_template":"x","raw_text":"CloudCo\n2026-08-01\nCurrency: USD\nSubtotal: 100\nTax: 10\nTotal: 110\ncloud software subscription","parser_version":"parser-v1"}; body=c.post("/extract",json=payload).json(); exp,_=predict_category(b,payload["raw_text"]); assert body["record"]["category"]["value"]==exp and body["category_artifact_sha256"]==b.artifact_sha256
def test_financial_conflict_is_never_silently_corrected():
    b=bundle(); c=TestClient(create_app(True,b)); payload={"document_id":"d","vendor_template":"x","raw_text":"Office\n2026-08-01\nCurrency: USD\nSubtotal: 100\nTax: 10\nTotal: 999\nprinter paper stationery","parser_version":"parser-v1"}; body=c.post("/extract",json=payload).json(); assert body["record"]["total"]["value"]==999 and body["record"]["needs_review"] is True and "amount_reconciliation_failed" in body["record"]["validation_errors"]
