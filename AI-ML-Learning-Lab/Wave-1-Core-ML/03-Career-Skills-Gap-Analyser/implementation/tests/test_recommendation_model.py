from career_gap.schemas import SkillEvidence, UserProfile, RoleProfile, RoleSkill
from career_gap.ontology import SkillOntology, OntologySkill
from career_gap.gap import analyse_gaps
from career_gap.recommend import prioritize_learning
from career_gap.semantic import SemanticMatcher
from career_gap.evaluation import benchmark_matchers, cohort_unknown_rates


def fixtures():
    ont=SkillOntology(version="ont-v1",skills=[OntologySkill(id="python",name="Python",aliases=["py"],category="eng"),OntologySkill(id="sql",name="SQL",aliases=["postgres database"],category="data"),OntologySkill(id="ml",name="Machine Learning",aliases=["predictive modeling"],category="ai",prerequisites=["python"])])
    role=RoleProfile(id="r",title="ML Engineer",version="r1",skills=[RoleSkill(skill_id="python",importance="required",target_level=3),RoleSkill(skill_id="sql",importance="required",target_level=2),RoleSkill(skill_id="ml",importance="preferred",target_level=2)])
    return ont,role

def test_required_gap_prioritized_over_preferred_unknown():
    ont,role=fixtures(); user=UserProfile(id="u",evidence=[SkillEvidence(skill_id="python",state="observed",proficiency=1,confidence=.9,source_id="cv")]); assert prioritize_learning(analyse_gaps(user,role,ont),ont)[0].skill_id=="python"

def test_prerequisite_boosts_learning_priority():
    ont,role=fixtures(); recs=prioritize_learning(analyse_gaps(UserProfile(id="u",evidence=[]),role,ont),ont); by={x.skill_id:x for x in recs}; assert by["python"].priority>by["ml"].priority

def test_semantic_matcher_maps_related_phrase():
    ont,_=fixtures(); assert SemanticMatcher(ont).fit().match("predictive modeling",min_score=.2).skill_id=="ml"

def test_semantic_matcher_abstains_on_unrelated_phrase():
    ont,_=fixtures(); assert SemanticMatcher(ont).fit().match("marine archaeology",min_score=.4).status=="unknown"

def test_semantic_benchmark_beats_exact_without_unknown_false_positives():
    ont,_=fixtures(); r=benchmark_matchers(ont); assert r.semantic_accuracy>=r.exact_accuracy and r.semantic_accuracy>=.875 and r.unknown_false_positive_rate==0

def test_cohort_unknown_rate_surfaces_sparse_profile_risk():
    rates=cohort_unknown_rates({'dense':['met','gap','unknown'],'sparse':['unknown','unknown','gap']}); assert rates['sparse']>rates['dense']
