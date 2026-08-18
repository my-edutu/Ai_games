from __future__ import annotations
from .schemas import UserProfile, Opportunity
from .eligibility import EDUCATION_ORDER

FEATURE_NAMES = [
    "skill_overlap",
    "preferred_skill_overlap",
    "interest_overlap",
    "type_preference",
    "location_preference",
    "education_margin",
    "experience_margin",
]


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    union = a | b
    return len(a & b) / len(union) if union else 0.0


def build_features(user: UserProfile, opportunity: Opportunity) -> dict[str, float]:
    user_skills = set(user.skills)
    req = set(opportunity.required_skills)
    pref = set(opportunity.preferred_skills)
    interests = set(user.interests)
    tags = set(opportunity.tags)
    edu_margin = EDUCATION_ORDER[user.education_level] - EDUCATION_ORDER[opportunity.min_education]
    exp_margin = user.years_experience - opportunity.min_years_experience
    values = {
        "skill_overlap": _jaccard(user_skills, req | pref),
        "preferred_skill_overlap": _jaccard(user_skills, pref),
        "interest_overlap": _jaccard(interests, tags),
        "type_preference": float(opportunity.opportunity_type in user.preferred_types) if user.preferred_types else 0.5,
        "location_preference": float(opportunity.location in user.preferred_locations) if user.preferred_locations else 0.5,
        "education_margin": max(0.0, min(1.0, edu_margin / 4.0)),
        "experience_margin": max(0.0, min(1.0, exp_margin / 5.0)),
    }
    return {name: float(values[name]) for name in FEATURE_NAMES}
