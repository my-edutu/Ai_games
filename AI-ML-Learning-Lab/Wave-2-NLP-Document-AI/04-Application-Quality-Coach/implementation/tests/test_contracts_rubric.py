import pytest
from pydantic import ValidationError
from application_coach.schemas import ReviewRequest, RewriteRequest
from application_coach.rubric import DEFAULT_RUBRIC, validate_rubric
from application_coach.evidence import extract_evidence_spans

def test_review_requires_meaningful_text():
    with pytest.raises(ValidationError): ReviewRequest(application_text="short", opportunity_criteria=["leadership"])
def test_rubric_weights_sum_to_one():
    assert abs(sum(d.weight for d in DEFAULT_RUBRIC.dimensions)-1.0)<1e-9
    assert validate_rubric(DEFAULT_RUBRIC)==[]
def test_evidence_spans_are_verbatim_substrings():
    text="I led a team of five volunteers. We increased attendance by 30%."; spans=extract_evidence_spans(text); assert spans; assert all(s.text in text for s in spans); assert any("30%" in s.text for s in spans)
def test_rewrite_requires_explicit_intent():
    with pytest.raises(ValidationError): RewriteRequest(application_text="I led a team of five volunteers.", rewrite_intent=False)
