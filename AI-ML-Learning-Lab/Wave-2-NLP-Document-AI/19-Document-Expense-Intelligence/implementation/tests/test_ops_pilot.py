from expense_intel.monitoring import VersionRegistry,drift_alert,field_confidence_drift
from expense_intel.pilot import representative_pilot
def test_versions_rollback_independently():
    r=VersionRegistry(); r.activate("parser","p1"); r.activate("category","c1"); r.activate("ruleset","r1"); r.rollback("parser","p0"); assert r.active=={"parser":"p0","category":"c1","ruleset":"r1"}
def test_drift_checks_review_rate_and_confidence(): assert drift_alert(.4,.1) and field_confidence_drift(.6,.9)
def test_representative_pilot_preserves_real_ocr_gate():
    p=representative_pilot(); assert p["p0"]==0 and p["p1"]==0 and p["real_ocr_validated"] is False
