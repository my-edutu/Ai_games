from fastapi.testclient import TestClient
from career_gap.api import create_app
from career_gap.ontology import SkillOntology, OntologySkill
from career_gap.schemas import RoleProfile, RoleSkill
from career_gap.monitoring import VersionRegistry, detect_drift, AuditLog


def app():
    ont=SkillOntology(version="ont-v1",skills=[OntologySkill(id="python",name="Python",aliases=[],category="eng"),OntologySkill(id="sql",name="SQL",aliases=[],category="data")]); role=RoleProfile(id="data",title="Data Analyst",version="role-v1",skills=[RoleSkill(skill_id="python",importance="required",target_level=2),RoleSkill(skill_id="sql",importance="required",target_level=2)]); return create_app(ont,{role.id:role})

def test_api_returns_versions_and_unknown_separately():
    r=TestClient(app()).post('/v1/analyse',json={"user_id":"u","role_id":"data","evidence":[{"skill_id":"python","state":"observed","proficiency":2,"confidence":.9,"source_id":"cv"}]}); assert r.status_code==200; body=r.json(); assert body["ontology_version"]=="ont-v1" and body["role_version"]=="role-v1" and any(x["skill_id"]=="sql" and x["status"]=="unknown" for x in body["gaps"])

def test_api_rejects_unknown_role(): assert TestClient(app()).post('/v1/analyse',json={"user_id":"u","role_id":"missing","evidence":[]}).status_code==404

def test_registry_rolls_ontology_and_model_independently():
    reg=VersionRegistry(); reg.register_ontology("o1"); reg.register_ontology("o2"); reg.register_model("m1"); reg.register_model("m2"); reg.activate_ontology("o2"); reg.activate_model("m2"); reg.rollback_ontology(); assert reg.active_ontology=="o1" and reg.active_model=="m2"

def test_drift_classifies_ontology_vs_profile_shift(): assert detect_drift(.3,.05,.8)=="ontology_drift" and detect_drift(.02,.4,.8)=="profile_drift"

def test_audit_log_is_append_only(tmp_path):
    log=AuditLog(tmp_path/'audit.jsonl'); log.append({"user_id":"u1"}); log.append({"user_id":"u2"}); assert [r["user_id"] for r in log.read()]==["u1","u2"]

def test_model_rollback_does_not_change_ontology():
    reg=VersionRegistry(); reg.register_ontology('o1'); reg.activate_ontology('o1'); reg.register_model('m1'); reg.register_model('m2'); reg.activate_model('m2'); reg.rollback_model(); assert reg.active_model=='m1' and reg.active_ontology=='o1'
