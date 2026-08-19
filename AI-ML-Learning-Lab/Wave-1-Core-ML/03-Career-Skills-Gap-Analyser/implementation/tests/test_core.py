from career_gap.schemas import SkillEvidence, RoleSkill, RoleProfile, UserProfile, EvidenceState
from career_gap.ontology import SkillOntology, OntologySkill
from career_gap.extractor import EvidenceExtractor
from career_gap.gap import analyse_gaps
from career_gap.dataset import snapshot_dataset


def ontology():
    return SkillOntology(version="ont-v1", skills=[OntologySkill(id="python", name="Python", aliases=["py"], category="engineering"),OntologySkill(id="sql", name="SQL", aliases=["postgresql"], category="data"),OntologySkill(id="ml", name="Machine Learning", aliases=["machine learning", "ml"], category="ai", prerequisites=["python"])])

def role():
    return RoleProfile(id="ml-eng", title="ML Engineer", version="role-v1", skills=[RoleSkill(skill_id="python", importance="required", target_level=3),RoleSkill(skill_id="sql", importance="required", target_level=2),RoleSkill(skill_id="ml", importance="preferred", target_level=2)])

def test_aliases_resolve_to_canonical_skill(): assert ontology().resolve("PostgreSQL").id == "sql"
def test_unknown_skill_returns_none(): assert ontology().resolve("cobol") is None

def test_extractor_marks_direct_resume_phrase_observed():
    ev=EvidenceExtractor(ontology()).extract("Built APIs in Python and PostgreSQL",source_id="cv"); states={e.skill_id:e.state for e in ev}; assert states["python"]==EvidenceState.observed and states["sql"]==EvidenceState.observed

def test_extractor_infers_prerequisite_but_labels_it_inferred():
    ev=EvidenceExtractor(ontology()).extract("Built production machine learning pipelines",source_id="project"); by={e.skill_id:e for e in ev}; assert by["ml"].state==EvidenceState.observed and by["python"].state==EvidenceState.inferred and by["python"].confidence<by["ml"].confidence

def test_absent_resume_text_is_unknown_not_missing():
    user=UserProfile(id="u1",evidence=[SkillEvidence(skill_id="python",state="observed",proficiency=3,confidence=.95,source_id="cv")]); assert analyse_gaps(user,role(),ontology()).by_skill("sql").status=="unknown"

def test_observed_below_target_is_gap():
    user=UserProfile(id="u1",evidence=[SkillEvidence(skill_id="sql",state="observed",proficiency=1,confidence=.9,source_id="cv")]); result=analyse_gaps(user,role(),ontology()); assert result.by_skill("sql").status=="gap" and result.by_skill("sql").gap_size==1

def test_observed_at_target_is_met():
    user=UserProfile(id="u1",evidence=[SkillEvidence(skill_id="python",state="observed",proficiency=3,confidence=.9,source_id="cv")]); assert analyse_gaps(user,role(),ontology()).by_skill("python").status=="met"

def test_protected_attributes_not_in_profile_contract(): assert "gender" not in UserProfile.model_fields and "race" not in UserProfile.model_fields

def test_dataset_snapshot_is_deterministic(tmp_path):
    u=UserProfile(id='u1',evidence=[]); a=snapshot_dataset([u],[role()],tmp_path/'a.json'); b=snapshot_dataset([u],[role()],tmp_path/'b.json'); assert a['sha256']==b['sha256']
