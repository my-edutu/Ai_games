from __future__ import annotations

from pydantic import BaseModel

from .schemas import Opportunity, UserProfile

EDUCATION_ORDER = {
    "none": 0,
    "primary": 1,
    "secondary": 2,
    "diploma": 3,
    "bachelors": 4,
    "masters": 5,
    "doctorate": 6,
}


class EligibilityResult(BaseModel):
    eligible: bool
    reason_codes: list[str]


def evaluate_eligibility(user: UserProfile, opportunity: Opportunity) -> EligibilityResult:
    reasons: list[str] = []
    if not opportunity.active:
        reasons.append("OPPORTUNITY_INACTIVE")
    if opportunity.min_age is not None and user.age < opportunity.min_age:
        reasons.append("AGE_BELOW_MINIMUM")
    if opportunity.max_age is not None and user.age > opportunity.max_age:
        reasons.append("AGE_ABOVE_MAXIMUM")
    if opportunity.eligible_citizenships and not set(user.citizenships).intersection(opportunity.eligible_citizenships):
        reasons.append("CITIZENSHIP_NOT_ELIGIBLE")
    if opportunity.eligible_residence_countries and user.residence_country.upper() not in {x.upper() for x in opportunity.eligible_residence_countries}:
        reasons.append("RESIDENCE_NOT_ELIGIBLE")
    if EDUCATION_ORDER[user.education_level] < EDUCATION_ORDER[opportunity.min_education]:
        reasons.append("EDUCATION_BELOW_MINIMUM")
    if user.years_experience < opportunity.min_years_experience:
        reasons.append("EXPERIENCE_BELOW_MINIMUM")
    missing_required = set(opportunity.required_skills) - set(user.skills)
    if missing_required:
        reasons.append("MISSING_REQUIRED_SKILL")
    if user.max_fee_usd is not None and opportunity.fee_usd > user.max_fee_usd:
        reasons.append("FEE_ABOVE_USER_LIMIT")
    return EligibilityResult(eligible=not reasons, reason_codes=reasons)
