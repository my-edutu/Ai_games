from datetime import date
import pytest
from pydantic import ValidationError

from scholarship_eligibility.schemas import Applicant, ScholarshipPolicy, EligibilityStatus
from scholarship_eligibility.policy import evaluate_eligibility, normalize_gpa


def policy(**overrides):
    base = dict(
        scholarship_id='sch-1',
        name='Future Leaders',
        version='2026.1',
        source_url='https://example.org/scholarship',
        effective_date=date(2026, 1, 1),
        deadline=date(2026, 12, 31),
        min_gpa_4=3.2,
        min_age=18,
        max_age=30,
        citizenship_allowlist={'NG','GH'},
        residency_allowlist={'NG','GH'},
        degree_levels={'undergraduate','masters'},
        fields={'engineering','computer-science'},
    )
    base.update(overrides)
    return ScholarshipPolicy(**base)


def applicant(**overrides):
    base = dict(
        applicant_id='a-1', age=22, citizenship='NG', residency='NG',
        degree_level='undergraduate', field='computer-science',
        gpa_value=4.2, gpa_scale=5.0,
    )
    base.update(overrides)
    return Applicant(**base)


def test_invalid_policy_requires_provenance_and_version():
    with pytest.raises(ValidationError):
        ScholarshipPolicy(scholarship_id='x', name='X', version='', source_url='', effective_date=date(2026,1,1), deadline=date(2026,12,1))


def test_normalize_gpa_supported_scales():
    assert normalize_gpa(4.0, 5.0) == pytest.approx(3.2)
    assert normalize_gpa(80, 100) == pytest.approx(3.2)
    assert normalize_gpa(3.5, 4.0) == pytest.approx(3.5)


def test_eligibility_is_deterministic_and_traced_to_policy():
    result = evaluate_eligibility(applicant(), policy(), as_of=date(2026, 6, 1))
    assert result.status is EligibilityStatus.ELIGIBLE
    assert result.policy_version == '2026.1'
    assert result.policy_source == 'https://example.org/scholarship'
    assert result.unmet_criteria == []
    assert result.unknown_criteria == []


def test_hard_failure_returns_ineligible_with_reason_code():
    result = evaluate_eligibility(applicant(age=35), policy(), as_of=date(2026, 6, 1))
    assert result.status is EligibilityStatus.INELIGIBLE
    assert 'AGE_ABOVE_MAX' in result.unmet_criteria


def test_missing_required_value_returns_needs_review_not_guess():
    result = evaluate_eligibility(applicant(gpa_value=None, gpa_scale=None), policy(), as_of=date(2026, 6, 1))
    assert result.status is EligibilityStatus.NEEDS_REVIEW
    assert 'GPA_UNKNOWN' in result.unknown_criteria


def test_ambiguous_gpa_scale_returns_needs_review():
    result = evaluate_eligibility(applicant(gpa_value=8.0, gpa_scale=10.0), policy(), as_of=date(2026, 6, 1))
    assert result.status is EligibilityStatus.NEEDS_REVIEW
    assert 'GPA_SCALE_UNSUPPORTED' in result.unknown_criteria


def test_expired_deadline_is_ineligible():
    result = evaluate_eligibility(applicant(), policy(deadline=date(2026, 5, 1)), as_of=date(2026, 6, 1))
    assert result.status is EligibilityStatus.INELIGIBLE
    assert 'DEADLINE_PASSED' in result.unmet_criteria
