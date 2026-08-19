from opportunity_fraud.monitoring import VersionRegistry, AuditLog, detect_drift
from opportunity_fraud.pilot import run_representative_pilot
from opportunity_fraud.release import validate_release_evidence
def test_versions_roll_back_independently():
    r=VersionRegistry(); r.activate('model','m1'); r.activate('data','d1'); r.activate('threat_policy','p1'); r.activate('model','m2'); r.rollback('model'); assert r.active['model']=='m1' and r.active['data']=='d1' and r.active['threat_policy']=='p1'
def test_drift_distinguishes_score_and_evidence_shift():
    d=detect_drift([0.1,0.2,0.15],[0.6,0.7,0.8],1.0,3.5); assert 'score_distribution_shift' in d and 'evidence_rate_shift' in d
def test_audit_log_is_append_only():
    a=AuditLog(); a.append({'id':'x','decision':'review'}); a.append({'id':'y','decision':'allow'}); assert len(a.events)==2 and a.events[0]['id']=='x'
def test_representative_pilot_has_review_comprehension_and_no_severe_issues():
    p=run_representative_pilot(); assert p['representative_not_real_world'] is True and p['p0']==0 and p['p1']==0 and p['risk_not_legal_conclusion_comprehension']==1.0 and p['evidence_trace_rate']==1.0
def test_release_validator_requires_full_evidence(tmp_path):
    issues=validate_release_evidence(tmp_path); assert 'MODEL_CARD.md' in issues and 'THREAT_MODEL.md' in issues and 'PILOT_REPORT.json' in issues
