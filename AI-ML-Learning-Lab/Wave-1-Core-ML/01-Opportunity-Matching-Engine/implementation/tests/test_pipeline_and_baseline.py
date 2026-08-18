from opportunity_matching.schemas import UserProfile, Opportunity
from opportunity_matching.features import build_features, FEATURE_NAMES
from opportunity_matching.baseline import BaselineRanker
from opportunity_matching.metrics import precision_at_k, recall_at_k, ndcg_at_k


def user():
    return UserProfile(user_id="u1", age=24, citizenships=["NG"], residence_country="NG", education_level="bachelors", years_experience=2, skills=["python", "sql"], interests=["climate", "data"], preferred_types=["internship"], preferred_locations=["remote"], max_fee_usd=0)


def opp(oid, **kwargs):
    data = dict(opportunity_id=oid, title=oid, opportunity_type="internship", min_age=18, max_age=35, eligible_citizenships=["NG"], eligible_residence_countries=["NG"], min_education="secondary", min_years_experience=0, required_skills=["python"], preferred_skills=["sql"], tags=["data"], location="remote", fee_usd=0, active=True)
    data.update(kwargs)
    return Opportunity(**data)


def test_feature_vector_is_deterministic_and_complete():
    a = build_features(user(), opp("o1"))
    b = build_features(user(), opp("o1"))
    assert a == b
    assert list(a) == FEATURE_NAMES
    assert 0 <= a["skill_overlap"] <= 1


def test_baseline_filters_ineligible_before_scoring():
    results = BaselineRanker().rank(user(), [opp("eligible"), opp("wrong_country", eligible_citizenships=["KE"])])
    assert [r.opportunity_id for r in results] == ["eligible"]


def test_baseline_prefers_more_relevant_eligible_opportunity():
    strong = opp("strong", preferred_skills=["sql"], tags=["data", "climate"], location="remote")
    weak = opp("weak", preferred_skills=["java"], tags=["finance"], location="US")
    results = BaselineRanker().rank(user(), [weak, strong])
    assert [r.opportunity_id for r in results] == ["strong", "weak"]
    assert results[0].score > results[1].score
    assert "skill_match" in results[0].reason_codes


def test_ranking_metrics_known_fixture():
    relevance = [1, 0, 1, 0]
    assert precision_at_k(relevance, 2) == 0.5
    assert recall_at_k(relevance, 2) == 0.5
    assert 0 < ndcg_at_k(relevance, 4) <= 1
