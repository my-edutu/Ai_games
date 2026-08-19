from datetime import date
from fastapi.testclient import TestClient

from scholarship_eligibility.schemas import Applicant, ScholarshipPolicy
from scholarship_eligibility.synthetic import generate_representative_applications
from scholarship_eligibility.dataset import temporal_split
from scholarship_eligibility.model import train_candidates, select_model
from scholarship_eligibility.robustness import score_suitability, fairness_report, predictive_feature_names
from scholarship_eligibility.api import create_app


def make_policy():
    return ScholarshipPolicy(
        scholarship_id='sch-2', name='STEM Africa', version='2026.2', source_url='https://example.org/stem',
        effective_date=date(2026,1,1), deadline=date(2026,12,31), min_gpa_4=3.0,
        min_age=18, max_age=35, citizenship_allowlist={'NG','GH'}, residency_allowlist={'NG','GH'},
        degree_levels={'undergraduate','masters'}, fields={'computer-science','engineering'},
    )


def make_model():
    df = generate_representative_applications(700, seed=31)
    train, validation = temporal_split(df, cutoff=date(2026,8,1))
    candidates = train_candidates(train)
    return select_model(candidates, validation)[1]


def applicant(**kw):
    base=dict(applicant_id='u1',age=22,citizenship='NG',residency='NG',degree_level='undergraduate',field='computer-science',
              gpa_value=4.1,gpa_scale=5.0,financial_need_score=.8,leadership_score=.7,community_service_score=.7,essay_score=.8,experience_score=.6,
              protected_group='group-a')
    base.update(kw); return Applicant(**base)


def test_protected_attribute_is_not_a_predictive_feature():
    assert 'protected_group' not in predictive_feature_names()


def test_suitability_abstains_when_required_predictive_inputs_are_missing():
    result = score_suitability(make_model(), applicant(essay_score=None))
    assert result.abstained is True
    assert 'PREDICTIVE_INPUT_MISSING' in result.reason_codes
    assert result.probability is None


def test_suitability_has_non_guarantee_disclaimer_and_model_version():
    result = score_suitability(make_model(), applicant())
    assert result.abstained is False
    assert 0 <= result.probability <= 1
    assert result.model_version
    assert 'not a guarantee' in result.disclaimer.lower()


def test_fairness_report_exposes_group_recall_gap_without_using_group_as_feature():
    df = generate_representative_applications(800, seed=14)
    train, test = temporal_split(df, cutoff=date(2026,8,1))
    model = select_model(train_candidates(train), test)[1]
    report = fairness_report(model, test, group_column='region')
    assert report['groups']
    assert report['max_recall_gap'] >= 0
    assert report['group_column'] == 'region'


def test_api_returns_policy_trace_and_suitability_separately():
    model = make_model(); client = TestClient(create_app(model))
    payload={'applicant':applicant().model_dump(mode='json'),'policy':make_policy().model_dump(mode='json'),'include_suitability':True,'as_of':'2026-06-01'}
    r=client.post('/v1/evaluate',json=payload)
    assert r.status_code==200
    body=r.json()
    assert body['eligibility']['status']=='eligible'
    assert body['eligibility']['policy_version']=='2026.2'
    assert body['suitability']['probability'] is not None
    assert 'guarantee' in body['suitability']['disclaimer'].lower()


def test_api_never_returns_suitability_for_ineligible_applicant():
    model = make_model(); client = TestClient(create_app(model))
    payload={'applicant':applicant(age=45).model_dump(mode='json'),'policy':make_policy().model_dump(mode='json'),'include_suitability':True,'as_of':'2026-06-01'}
    body=client.post('/v1/evaluate',json=payload).json()
    assert body['eligibility']['status']=='ineligible'
    assert body['suitability'] is None
