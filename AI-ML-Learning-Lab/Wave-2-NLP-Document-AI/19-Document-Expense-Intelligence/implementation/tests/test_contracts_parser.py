from expense_intel.schemas import DocumentInput
from expense_intel.parser import parse_document
def test_parser_extracts_fields_with_confidence():
    d=DocumentInput(document_id="1",vendor_template="cafe",raw_text="Cafe One\n2026-08-01\nCurrency: USD\nSubtotal: 100\nTax: 10\nTotal: 110")
    r=parse_document(d); assert r.vendor.value=="Cafe One" and r.total.value==110; assert r.total.confidence>=.9 and not r.needs_review
def test_missing_total_forces_review():
    d=DocumentInput(document_id="1",vendor_template="x",raw_text="Vendor\n2026-08-01\nCurrency: USD\nSubtotal: 10"); assert parse_document(d).needs_review
