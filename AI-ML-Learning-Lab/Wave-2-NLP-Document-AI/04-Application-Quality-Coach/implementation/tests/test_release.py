from application_coach.release import validate_release_evidence
from application_coach.pilot import representative_pilot
def test_representative_pilot_has_zero_severe_findings():
    r=representative_pilot(30); assert r["p0"]==0 and r["p1"]==0 and r["grounding_precision"]==1.0 and r["rewrite_faithfulness"]==1.0 and r["representative_not_real_world"] is True
def test_release_gate_requires_governance_artifacts(tmp_path):
    required=["MODEL_CARD.md","DATA_CARD.md","RUBRIC_CARD.md","RUNBOOK.md","SLOS.md","KNOWN_LIMITATIONS.md","SECURITY_PRIVACY.md","OWNERSHIP.md","ROLLBACK.md","PILOT_REPORT.json","BENCHMARK.json","PRODUCTION_HARDENING_AUDIT.md"]
    for f in required: (tmp_path/f).write_text("x")
    assert validate_release_evidence(tmp_path)==[]; (tmp_path/"RUBRIC_CARD.md").unlink(); assert "missing:RUBRIC_CARD.md" in validate_release_evidence(tmp_path)
