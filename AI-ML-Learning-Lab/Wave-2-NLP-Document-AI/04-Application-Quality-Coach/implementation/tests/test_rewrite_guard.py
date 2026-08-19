from application_coach.rewrite import rewrite_application,extract_fact_inventory,validate_rewrite_faithfulness
from application_coach.schemas import RewriteRequest
TEXT="I led five volunteers. We increased school attendance by 30% in three months."
def test_fact_inventory_extracts_numbers_and_named_achievement_phrases():
    inv=extract_fact_inventory(TEXT); assert "five" in inv.tokens or "5" in inv.tokens; assert "30%" in inv.tokens
def test_rewrite_preserves_source_facts_and_does_not_add_numbers():
    out=rewrite_application(RewriteRequest(application_text=TEXT,rewrite_intent=True)); assert validate_rewrite_faithfulness(TEXT,out.rewritten_text)==[]; assert "30%" in out.rewritten_text
def test_guard_rejects_new_quantified_achievement():
    assert any("new_fact" in x for x in validate_rewrite_faithfulness(TEXT,TEXT+" I also raised $10,000."))
def test_guard_rejects_new_employer_or_award_claim():
    assert validate_rewrite_faithfulness(TEXT,TEXT+" I received the Rhodes Scholarship from Oxford.")
