from application_coach.review import review_application
from application_coach.schemas import ReviewRequest
STRONG="I led a team of five volunteers to run weekly tutoring sessions. Over three months, attendance increased by 30%, from 50 to 65 learners. I learned to delegate tasks and measure progress."
WEAK="I am passionate and hardworking. I deserve this opportunity because it will help me achieve my dreams."
def test_strong_application_scores_above_weak():
    crit=["leadership","measurable impact","learning"]; assert review_application(ReviewRequest(application_text=STRONG,opportunity_criteria=crit)).overall_score > review_application(ReviewRequest(application_text=WEAK,opportunity_criteria=crit)).overall_score
def test_every_positive_dimension_score_has_grounding_or_insufficient_evidence():
    r=review_application(ReviewRequest(application_text=WEAK,opportunity_criteria=["leadership"])); assert all(d.evidence_spans or d.status=="insufficient_evidence" for d in r.dimensions)
def test_review_keeps_critique_separate_from_rewrite():
    r=review_application(ReviewRequest(application_text=STRONG,opportunity_criteria=["leadership"])); assert not hasattr(r,"rewritten_text")
def test_relevance_uses_opportunity_criteria():
    a=review_application(ReviewRequest(application_text=STRONG,opportunity_criteria=["leadership","team"])); b=review_application(ReviewRequest(application_text=STRONG,opportunity_criteria=["derivatives","accounting"])); ad={d.name:d.score for d in a.dimensions}; bd={d.name:d.score for d in b.dimensions}; assert ad["relevance"]>bd["relevance"]
