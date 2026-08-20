from expense_intel.schemas import DocumentInput
from expense_intel.parser import parse_document
from expense_intel.validation import validate_record
from expense_intel.dedup import DuplicateIndex
def rec(total=110): return validate_record(parse_document(DocumentInput(document_id="a",vendor_template="x",raw_text=f"Vendor\n2026-08-01\nCurrency: USD\nSubtotal: 100\nTax: 10\nTotal: {total}")))
def test_reconciliation_failure_forces_review():
    r=rec(150); assert "amount_reconciliation_failed" in r.validation_errors and r.needs_review
def test_duplicate_detection():
    idx=DuplicateIndex(); a=rec(); idx.check(a); b=rec(); b.document_id="b"; idx.check(b); assert b.duplicate_of=="a" and b.needs_review
