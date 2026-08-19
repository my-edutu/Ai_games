from african_moderation.synthetic import make_dataset
from african_moderation.dataset import snapshot_dataset, quality_report
from african_moderation.monitoring import VersionRegistry, ReviewQueue, detect_drift
from african_moderation.pilot import run_representative_pilot
from african_moderation.release import validate_release_evidence
def test_dataset_snapshot_and_quality_are_deterministic_per_language():
    rows=make_dataset(); a=snapshot_dataset(rows); b=snapshot_dataset(rows); q=quality_report(rows); assert a['sha256']==b['sha256'] and a['rows']==len(rows) and q['languages']=={'pcm':45,'sw':45} and q['native_speaker_validated'] is False
def test_versions_roll_back_independently():
    r=VersionRegistry(); r.activate('model','m1'); r.activate('policy','p1'); r.activate('data','d1'); r.activate('model','m2'); r.rollback('model'); assert r.active=={'model':'m1','policy':'p1','data':'d1'}
def test_review_queue_collects_uncertain_items_without_mutating_history():
    q=ReviewQueue(); q.add({'id':'x','language':'sw','confidence':0.4}); q.add({'id':'y','language':'pcm','confidence':0.5}); assert len(q.items)==2 and q.items[0]['id']=='x'
def test_drift_reports_per_language_uncertainty_shift():
    d=detect_drift({'sw':0.1,'pcm':0.1},{'sw':0.35,'pcm':0.12}); assert 'sw:uncertainty_shift' in d and 'pcm:uncertainty_shift' not in d
def test_pilot_and_release_gate_preserve_native_speaker_boundary(tmp_path):
    p=run_representative_pilot(); issues=validate_release_evidence(tmp_path); assert p['p0']==0 and p['p1']==0 and p['native_speaker_validated'] is False and p['decision']=='GO_FOR_CONTROLLED_DEPLOYMENT' and 'LANGUAGE_POLICY_CARD.md' in issues and 'PILOT_REPORT.json' in issues
