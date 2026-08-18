from __future__ import annotations
import random
from .schemas import UserProfile, Opportunity
from .features import build_features

SKILLS = ["python", "sql", "design", "research", "excel", "marketing"]
TAGS = ["data", "climate", "health", "finance", "education", "community"]
TYPES = ["internship", "fellowship", "grant", "job"]
LOCATIONS = ["remote", "NG", "GH", "KE"]


def _hidden_relevance(features: dict[str, float]) -> int:
    score = (
        1.7 * features["type_preference"] * features["location_preference"]
        + 1.2 * features["interest_overlap"]
        + 0.8 * features["preferred_skill_overlap"]
        + 0.3 * features["skill_overlap"]
        + 0.2 * features["experience_margin"]
    )
    if score >= 2.2:
        return 3
    if score >= 1.5:
        return 2
    if score >= 0.8:
        return 1
    return 0


def _user(rng: random.Random, idx: int) -> UserProfile:
    return UserProfile(
        user_id=f"u{idx}", age=rng.randint(20, 35), citizenships=["NG"], residence_country="NG",
        education_level=rng.choice(["diploma", "bachelors", "masters"]), years_experience=rng.uniform(0, 6),
        skills=rng.sample(SKILLS, 3), interests=rng.sample(TAGS, 2), preferred_types=[rng.choice(TYPES)],
        preferred_locations=[rng.choice(LOCATIONS)], max_fee_usd=100,
    )


def _opportunity(rng: random.Random, uid: int, idx: int) -> Opportunity:
    return Opportunity(
        opportunity_id=f"o{uid}_{idx}", title=f"Opportunity {uid}-{idx}", opportunity_type=rng.choice(TYPES),
        min_age=18, max_age=60, eligible_citizenships=["NG"], eligible_residence_countries=["NG"],
        min_education="secondary", min_years_experience=0, required_skills=[rng.choice(SKILLS)],
        preferred_skills=rng.sample(SKILLS, 2), tags=rng.sample(TAGS, 2), location=rng.choice(LOCATIONS), fee_usd=0, active=True,
    )


def make_training_rows(n_users: int = 100, n_opportunities: int = 20, seed: int = 7) -> list[dict[str, float | int]]:
    rng = random.Random(seed)
    rows: list[dict[str, float | int]] = []
    for uidx in range(n_users):
        user = _user(rng, uidx)
        for oidx in range(n_opportunities):
            opp = _opportunity(rng, uidx, oidx)
            features = build_features(user, opp)
            rows.append({**features, "label": _hidden_relevance(features)})
    return rows


def make_benchmark_queries(seed: int = 13, n_users: int = 24, n_opportunities: int = 18):
    rng = random.Random(seed)
    queries = []
    for uidx in range(n_users):
        user = _user(rng, 1000 + uidx)
        opps = [_opportunity(rng, 1000 + uidx, i) for i in range(n_opportunities)]
        relevance = {opp.opportunity_id: _hidden_relevance(build_features(user, opp)) for opp in opps}
        queries.append((user, opps, relevance))
    return queries
