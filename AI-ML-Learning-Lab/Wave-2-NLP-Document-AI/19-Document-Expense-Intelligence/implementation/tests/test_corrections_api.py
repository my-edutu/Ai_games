from expense_intel.corrections import CorrectionLedger
from expense_intel.api import create_app
from expense_intel.category_synthetic import category_dataset
from expense_intel.category_model import train_category_model
from fastapi.testclient import TestClient
def test_correction_ledger_is_hash_chained():
    l=CorrectionLedger(); l.append("d","total",100,110,"r1"); l.append("d","tax",0,10,"r1"); assert l.verify()
def test_api_fails_closed_without_parser(): assert TestClient(create_app(False,None)).get("/health/ready").status_code==503
def test_api_returns_traceability_and_review_policy():
    X,y=category_dataset(); c=TestClient(create_app(True,train_category_model(X,y))); payload={"document_id":"d","vendor_template":"x","raw_text":"Vendor\n2026-08-01\nCurrency: USD\nSubtotal: 100\nTax: 10\nTotal: 110","parser_version":"parser-v1"}; b=c.post("/extract",json=payload).json(); assert b["artifact_sha256"] and "does not silently correct" in b["disclaimer"]
