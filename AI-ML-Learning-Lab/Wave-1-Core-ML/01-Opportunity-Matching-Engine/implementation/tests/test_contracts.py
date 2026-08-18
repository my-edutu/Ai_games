import pytest
from pydantic import ValidationError

from opportunity_matching.schemas import UserProfile, Opportunity
from opportunity_matching.eligibility import evaluate_eligibility


def base_user(**overrides):
    data = dict(user_id="u1", age=22, citizenships=["NG"], residence_country="NG", education_level="bachelors", years_experience=2.0, skills=["python", "sql"], interests=["data", "climate"], preferred_types=["internship"], preferred_locations=["NG", "remote"], max_fee_usd=50.0)
    data.update(overrides)
    return UserProfile(**data)


def base_opp(**overrides):
    data = dict(opportunity_id="o1", title="Data Internship", opportunity_type="internship", min_age=18, max_age=30, eligible_citizenships=["NG", "GH"], eligible_residence_countries=["NG"], min_education="secondary", min_years_experience=0.0, required_skills=["python"], preferred_skills=["sql"], tags=["data"], location="remote", fee_usd=0.0, active=True)
    data.update(overrides)
    return Opportunity(**data)


def test_invalid_age_is_rejected_before_ranking():
    with pytest.raises(ValidationError):
        base_user(age=-1)


def test_hard_eligibility_rejects_citizenship_mismatch_with_reason_code():
    result = evaluate_eligibility(base_user(citizenships=["KE"]), base_opp())
    assert result.eligible is False
    assert "CITIZENSHIP_NOT_ELIGIBLE" in result.reason_codes


def test_hard_eligibility_accepts_valid_candidate():
    result = evaluate_eligibility(base_user(), base_opp())
    assert result.eligible is True
    assert result.reason_codes == []


def test_explicit_user_fee_limit_is_a_hard_constraint():
    result = evaluate_eligibility(base_user(max_fee_usd=10), base_opp(fee_usd=25))
    assert result.eligible is False
    assert "FEE_ABOVE_USER_LIMIT" in result.reason_codes


def test_protected_attributes_are_not_model_features():
    user = base_user(gender="female", disability_status="prefer_not_to_say")
    assert "gender" not in user.ranking_feature_dict()
    assert "disability_status" not in user.ranking_feature_dict()
