from simulation_evaluator.release import validate_release, deployment_scope

def test_release_requires_complete_evidence(tmp_path):
    assert validate_release(tmp_path)

def test_broad_deployment_requires_real_reviewer_validation():
    assert deployment_scope(real_reviewer_validated=False) == 'controlled_only'
    assert deployment_scope(real_reviewer_validated=True) == 'broad_candidate'
