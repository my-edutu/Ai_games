from medical_no_show.monitoring import VersionRegistry, diagnose_drift, AuditLog
from medical_no_show.pilot import run_representative_pilot
from medical_no_show.release import validate_release_evidence
from pathlib import Path

def test_versions_roll_back_independently():
    r=VersionRegistry()
    r.activate("model","m2"); r.activate("data","d2"); r.activate("policy","p2")
    r.rollback("policy","p1")
    assert r.active["model"]=="m2" and r.active["data"]=="d2" and r.active["policy"]=="p1"

def test_drift_diagnosis_distinguishes_data_policy_and_model():
    assert diagnose_drift(data_shift=True, policy_change=False, calibration_shift=False)=="data_drift"
    assert diagnose_drift(data_shift=False, policy_change=True, calibration_shift=False)=="policy_change"
    assert diagnose_drift(data_shift=False, policy_change=False, calibration_shift=True)=="model_calibration_drift"

def test_audit_log_append_only():
    a=AuditLog(); a.append({"id":1}); a.append({"id":2})
    assert [x["id"] for x in a.entries]==[1,2]

def test_representative_shadow_pilot_has_no_p0_p1():
    p=run_representative_pilot()
    assert p["representative_not_real_world"] is True and p["p0"]==0 and p["p1"]==0
    assert p["decision"]=="GO_FOR_CONTROLLED_DEPLOYMENT"

def test_release_validator_requires_evidence(tmp_path):
    issues=validate_release_evidence(tmp_path)
    assert "MODEL_CARD.md" in issues and "SAFE_INTERVENTION_POLICY.md" in issues
