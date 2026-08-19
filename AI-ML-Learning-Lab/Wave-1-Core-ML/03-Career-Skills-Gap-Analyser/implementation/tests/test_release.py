from career_gap.pilot import run_representative_pilot
from career_gap.release import validate_release_evidence

def test_representative_pilot_has_no_p0_p1_and_labels_synthetic():
    p=run_representative_pilot(); assert p["representative_not_real_world"] is True and p["p0"]==0 and p["p1"]==0 and p["decision"]=="GO_FOR_CONTROLLED_DEPLOYMENT"

def test_release_validator_requires_cards_and_pilot(tmp_path):
    issues=validate_release_evidence(tmp_path); assert "MODEL_CARD.md" in issues and "PILOT_REPORT.json" in issues
