from __future__ import annotations
from pydantic import BaseModel
from .schemas import UserProfile, Opportunity
from .eligibility import evaluate_eligibility
from .features import build_features


class RankedOpportunity(BaseModel):
    opportunity_id: str
    score: float
    reason_codes: list[str]
    eligibility_reasons: list[str] = []


class BaselineRanker:
    WEIGHTS = {
        "skill_overlap": 0.30,
        "preferred_skill_overlap": 0.20,
        "interest_overlap": 0.15,
        "type_preference": 0.15,
        "location_preference": 0.10,
        "education_margin": 0.05,
        "experience_margin": 0.05,
    }

    def score(self, user: UserProfile, opportunity: Opportunity) -> tuple[float, list[str]]:
        f = build_features(user, opportunity)
        score = sum(f[k] * w for k, w in self.WEIGHTS.items())
        reasons = []
        if f["skill_overlap"] >= 0.5:
            reasons.append("skill_match")
        if f["interest_overlap"] > 0:
            reasons.append("interest_match")
        if f["type_preference"] == 1:
            reasons.append("preferred_type")
        if f["location_preference"] == 1:
            reasons.append("preferred_location")
        return round(float(score), 6), reasons

    def rank(self, user: UserProfile, opportunities: list[Opportunity], top_k: int | None = None) -> list[RankedOpportunity]:
        ranked: list[RankedOpportunity] = []
        for opp in opportunities:
            eligibility = evaluate_eligibility(user, opp)
            if not eligibility.eligible:
                continue
            score, reasons = self.score(user, opp)
            ranked.append(RankedOpportunity(opportunity_id=opp.opportunity_id, score=score, reason_codes=reasons))
        ranked.sort(key=lambda x: (-x.score, x.opportunity_id))
        return ranked[:top_k] if top_k is not None else ranked
