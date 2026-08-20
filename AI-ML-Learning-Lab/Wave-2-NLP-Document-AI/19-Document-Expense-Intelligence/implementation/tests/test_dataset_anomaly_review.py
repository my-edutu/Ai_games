from expense_intel.synthetic import fixtures
from expense_intel.dataset import split_by_vendor_template,dataset_sha256
from expense_intel.schemas import DocumentInput
from expense_intel.parser import parse_document
from expense_intel.validation import validate_record
from expense_intel.anomaly import anomaly_reasons
from expense_intel.corrections import CorrectionLedger
from expense_intel.review import apply_correction
def test_vendor_template_holdout_has_no_overlap():
    tr,te=split_by_vendor_template(fixtures()); assert set(d.vendor_template for d in tr).isdisjoint(set(d.vendor_template for d in te))
def test_dataset_hash_is_deterministic(): assert dataset_sha256(fixtures())==dataset_sha256(fixtures())
def test_anomaly_flags_extreme_total_and_reconciliation():
    d=DocumentInput(document_id="z",vendor_template="x",raw_text="Vendor\n2026-08-01\nCurrency: USD\nSubtotal: 10\nTax: 1\nTotal: 2000000"); reasons=anomaly_reasons(validate_record(parse_document(d))); assert "extreme_total" in reasons and "reconciliation_conflict" in reasons
def test_correction_preserves_original_and_appends_audit_event():
    d=DocumentInput(document_id="z",vendor_template="x",raw_text="Vendor\n2026-08-01\nCurrency: USD\nSubtotal: 10\nTax: 1\nTotal: 11"); r=parse_document(d); l=CorrectionLedger(); c=apply_correction(r,"total",12,"reviewer",l); assert r.total.value==11 and c.total.value==12 and len(l.events)==1 and l.verify()
