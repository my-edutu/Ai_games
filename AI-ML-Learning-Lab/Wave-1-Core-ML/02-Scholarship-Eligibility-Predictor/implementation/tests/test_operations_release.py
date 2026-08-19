import numpy as np

from scholarship_eligibility.monitoring import PolicyRegistry, ModelRegistry, AuditLog, monitoring_status
from scholarship_eligibility.pilot import run_representative_pilot
from scholarship_eligibility.release import validate_release_evidence, REQUIRED_EVIDENCE


def test_policy_and_model_registries_are_separate_and_rollback_independently(tmp_path):
    policies = PolicyRegistry(); models = ModelRegistry()
    policies.register('sch-1','2026.1',{'source':'v1'}); policies.register('sch-1','2026.2',{'source':'v2'})
    models.register('model-1',{'artifact':'a'}); models.register('model-2',{'artifact':'b'})
    policies.activate('sch-1','2026.2'); models.activate('model-2')
    assert policies.active('sch-1')[0] == '2026.2'
    assert models.active()[0] == 'model-2'
    policies.rollback('sch-1')
    assert policies.active('sch-1')[0] == '2026.1'
    assert models.active()[0] == 'model-2'


def test_monitoring_distinguishes_policy_data_from_model_failure():
    policy_problem = monitoring_status(unknown_field_rate=.22, criteria_parse_failure_rate=.01, baseline_probability_mean=.32, current_probabilities=np.array([.31,.33,.34]))
    model_problem = monitoring_status(unknown_field_rate=.01, criteria_parse_failure_rate=.0, baseline_probability_mean=.30, current_probabilities=np.array([.65,.7,.68]))
    assert policy_problem['primary_failure_domain'] == 'policy_data'
    assert model_problem['primary_failure_domain'] == 'model'


def test_audit_log_is_append_only_and_traceable(tmp_path):
    log = AuditLog(tmp_path/'audit.jsonl')
    log.append({'decision_id':'d1','policy_version':'2026.1','model_version':'m1','status':'eligible'})
    log.append({'decision_id':'d2','policy_version':'2026.2','model_version':'m1','status':'needs_review'})
    rows = log.read()
    assert [r['decision_id'] for r in rows] == ['d1','d2']
    assert rows[1]['policy_version'] == '2026.2'


def test_representative_pilot_reaches_policy_accuracy_and_comprehension_gate():
    report = run_representative_pilot(seed=9)
    assert report['policy_accuracy'] == 1.0
    assert report['comprehension_pass_rate'] == 1.0
    assert report['p0_findings'] == 0
    assert report['p1_findings'] == 0
    assert report['decision'] == 'GO_FOR_CONTROLLED_DEPLOYMENT'
    assert report['representative_only'] is True


def test_release_gate_blocks_missing_evidence(tmp_path):
    missing = validate_release_evidence(tmp_path)
    assert set(REQUIRED_EVIDENCE).issubset(set(missing))


def test_release_gate_passes_complete_evidence_and_rejects_guarantee_claim(tmp_path):
    for name in REQUIRED_EVIDENCE:
        (tmp_path/name).write_text('owner: ML Platform\nstatus: verified\n', encoding='utf-8')
    assert validate_release_evidence(tmp_path) == []
    (tmp_path/'MODEL_CARD.md').write_text('This model guarantees you will win a scholarship.', encoding='utf-8')
    issues = validate_release_evidence(tmp_path)
    assert any('PROHIBITED_GUARANTEE_CLAIM' in x for x in issues)
