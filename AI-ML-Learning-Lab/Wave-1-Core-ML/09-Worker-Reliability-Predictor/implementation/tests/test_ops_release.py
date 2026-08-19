from worker_reliability.monitoring import VersionRegistry, diagnose_drift, AuditLog
from worker_reliability.pilot import run_representative_pilot
from worker_reliability.release import validate_release_evidence

def test_versions_rollback_independently():
    r=VersionRegistry(); r.activate('model','m1'); r.activate('data','d1'); r.activate('policy','p1'); r.activate('model','m2'); r.rollback('model'); assert r.active['model']=='m1' and r.active['data']=='d1' and r.active['policy']=='p1'
def test_drift_diagnosis_separates_data_model_policy():
    assert diagnose_drift(.3,.01,.0)=='data_drift'; assert diagnose_drift(.01,.12,.0)=='model_calibration_drift'; assert diagnose_drift(.01,.01,.2)=='policy_change'
def test_audit_log_append_only_records_versions_and_review():
    a=AuditLog(); a.append(event_id='e1',model='m1',data='d1',policy='p1',review='required'); assert a.records[0]['model']=='m1' and a.records[0]['review']=='required'
def test_representative_pilot_has_appeal_comprehension_and_no_p0_p1():
    p=run_representative_pilot(); assert p['representative_not_real_world'] is True and p['p0']==0 and p['p1']==0 and p['appeal_path_comprehension']==1.0 and p['decision']=='GO_FOR_CONTROLLED_DEPLOYMENT'
def test_release_gate_requires_restricted_use_and_appeals(tmp_path):
    issues=validate_release_evidence(tmp_path); assert 'RESTRICTED_USE.md' in issues and 'APPEALS_CORRECTIONS.md' in issues and 'MODEL_CARD.md' in issues
