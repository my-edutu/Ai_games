from datetime import datetime, timedelta, timezone
from medical_no_show.schemas import Appointment, PatientHistory, HistoryEvent
from medical_no_show.features import build_features, FEATURE_NAMES
from medical_no_show.interventions import recommend_interventions, PROHIBITED_ACTIONS
from medical_no_show.dataset import snapshot_hash

def appt():
    return Appointment(appointment_id="a1", patient_id="p1",
        scheduled_at=datetime(2026,8,1,tzinfo=timezone.utc),
        appointment_at=datetime(2026,8,20,tzinfo=timezone.utc),
        clinic="general", reminder_opt_in=True, transport_barrier=True)

def test_feature_contract_excludes_protected_traits_and_future_history():
    a=appt()
    h=PatientHistory(patient_id="p1", events=[
        HistoryEvent(at=datetime(2026,7,1,tzinfo=timezone.utc), outcome="attended"),
        HistoryEvent(at=datetime(2026,8,19,tzinfo=timezone.utc), outcome="no_show")])
    f=build_features(a,h,as_of=datetime(2026,8,10,tzinfo=timezone.utc))
    assert "age" not in FEATURE_NAMES and "sex" not in FEATURE_NAMES and "race" not in FEATURE_NAMES
    assert f["prior_no_show_rate"] == 0.0

def test_no_history_is_uncertainty_not_high_risk_evidence():
    f=build_features(appt(), PatientHistory(patient_id="p1", events=[]), as_of=datetime(2026,8,10,tzinfo=timezone.utc))
    assert f["history_count"] == 0 and f["history_missing"] == 1

def test_intervention_policy_allows_support_and_blocks_care_denial():
    acts=recommend_interventions(0.8, transport_barrier=True)
    assert "transport_support" in acts
    assert not (set(acts) & PROHIBITED_ACTIONS)

def test_snapshot_hash_is_deterministic():
    rows=[{"appointment_id":"a1","x":1},{"appointment_id":"a2","x":2}]
    assert snapshot_hash(rows)==snapshot_hash(list(reversed(rows)))
