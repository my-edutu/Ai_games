from cashflow_forecaster.monitoring import drift_report, VersionRegistry, AuditLog
from cashflow_forecaster.release import validate_release_evidence

def test_drift_report_detects_coverage_and_error_regression():
    r=drift_report(reference_mae=10,current_mae=16,reference_coverage=.8,current_coverage=.55)
    assert r["mae_drift"] is True and r["coverage_drift"] is True

def test_registry_rolls_model_data_policy_independently():
    reg=VersionRegistry("m1","d1","p1"); reg.activate("model","m2"); reg.activate("data","d2"); reg.rollback("model")
    assert reg.active_model=="m1" and reg.active_data=="d2" and reg.active_policy=="p1"

def test_audit_log_is_append_only_view():
    log=AuditLog(); log.append({"request_id":"r1"}); log.append({"request_id":"r2"})
    assert [x["request_id"] for x in log.entries()]==["r1","r2"]

def test_release_validator_requires_operational_evidence(tmp_path):
    issues=validate_release_evidence(tmp_path)
    assert "MODEL_CARD.md" in issues and "BACKTEST_REPORT.json" in issues
