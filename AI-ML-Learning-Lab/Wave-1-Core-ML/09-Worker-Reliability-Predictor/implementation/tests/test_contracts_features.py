from datetime import datetime, timezone, timedelta
from worker_reliability.schemas import WorkerProfile, WorkEvent, HistoryEvent, PredictionRequest
from worker_reliability.features import build_event_features, SERVING_FEATURES
from worker_reliability.corrections import CorrectionLedger
UTC=timezone.utc

def worker(**kw):
    d=dict(worker_id='w1',tenure_days=120,protected_group='audit-A',home_postcode='10001'); d.update(kw); return WorkerProfile(**d)
def event(**kw):
    d=dict(event_id='e1',starts_at=datetime(2026,8,20,9,tzinfo=UTC),booking_created_at=datetime(2026,8,18,9,tzinfo=UTC),distance_km=5.0,expected_duration_hours=8.0,shift_type='day'); d.update(kw); return WorkEvent(**d)
def test_request_is_event_scoped_not_persistent_score():
    r=PredictionRequest(worker=worker(),event=event(),history=[]); assert r.event.event_id=='e1' and not hasattr(r,'persistent_reliability_score')
def test_protected_and_proxy_fields_never_enter_serving_features():
    assert 'protected_group' not in SERVING_FEATURES and 'home_postcode' not in SERVING_FEATURES
def test_temporal_features_ignore_future_history():
    e=event(); h=[HistoryEvent(event_id='old',occurred_at=e.starts_at-timedelta(days=10),outcome='completed',lateness_minutes=0),HistoryEvent(event_id='future',occurred_at=e.starts_at+timedelta(days=1),outcome='cancelled',lateness_minutes=0)]; f=build_event_features(worker(),e,h,cutoff=e.starts_at); assert f['history_count']==1 and f['cancel_rate']==0
def test_missing_history_is_not_assumed_bad():
    f=build_event_features(worker(),event(),[],cutoff=event().starts_at); assert f['history_count']==0 and f['cancel_rate']==0 and f['completion_rate']==0
def test_correction_ledger_replaces_incorrect_history_and_is_auditable():
    ledger=CorrectionLedger(); original=HistoryEvent(event_id='x',occurred_at=datetime(2026,8,1,tzinfo=UTC),outcome='cancelled',lateness_minutes=0); corrected=HistoryEvent(event_id='x',occurred_at=datetime(2026,8,1,tzinfo=UTC),outcome='completed',lateness_minutes=0); ledger.submit('w1',original,corrected,'worker supplied attendance evidence'); out=ledger.apply('w1',[original]); assert out[0].outcome=='completed' and ledger.audit_log[0]['reason']
def test_dataset_snapshot_is_deterministic():
    from worker_reliability.dataset import snapshot_rows
    rows=[{'tenure_days':10,'history_count':2}]; assert snapshot_rows(rows)['sha256']==snapshot_rows(rows)['sha256']
