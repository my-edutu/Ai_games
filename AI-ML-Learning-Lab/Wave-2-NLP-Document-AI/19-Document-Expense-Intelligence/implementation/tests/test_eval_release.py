from expense_intel.synthetic import fixtures
from expense_intel.parser import parse_document
from expense_intel.validation import validate_record
from expense_intel.evaluation import exact_field_accuracy,amount_mae
from expense_intel.release import missing_evidence,REQUIRED
def test_representative_fixture_accuracy():
    docs=fixtures(); preds=[validate_record(parse_document(d)) for d in docs]; truths=[{"vendor":d.raw_text.splitlines()[0],"total":float(110+i)} for i,d in enumerate(docs)]; assert exact_field_accuracy(preds,truths,"vendor")==1.0; assert amount_mae(preds,truths,"total")==0
def test_release_gate(): assert missing_evidence(REQUIRED)==[]
