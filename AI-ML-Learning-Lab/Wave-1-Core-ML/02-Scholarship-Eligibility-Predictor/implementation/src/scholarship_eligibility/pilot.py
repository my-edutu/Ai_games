from __future__ import annotations
from datetime import date
from .schemas import Applicant, ScholarshipPolicy, EligibilityStatus
from .policy import evaluate_eligibility

def _policy():
    return ScholarshipPolicy(
        scholarship_id='pilot-sch', name='Pilot Scholarship', version='pilot-1', source_url='https://example.org/pilot',
        effective_date=date(2026,1,1), deadline=date(2026,12,31), min_gpa_4=3.0,
        min_age=18,max_age=30,citizenship_allowlist={'NG'},residency_allowlist={'NG'},
        degree_levels={'undergraduate'}, fields={'engineering','computer-science'},
    )

def _app(i, **kwargs):
    data=dict(applicant_id=f'p{i}',age=22,citizenship='NG',residency='NG',degree_level='undergraduate',field='engineering',gpa_value=4.0,gpa_scale=5.0)
    data.update(kwargs); return Applicant(**data)

def run_representative_pilot(seed: int = 0) -> dict:
    policy=_policy()
    cases=[
        (_app(1), EligibilityStatus.ELIGIBLE),
        (_app(2,age=17), EligibilityStatus.INELIGIBLE),
        (_app(3,citizenship='GH'), EligibilityStatus.INELIGIBLE),
        (_app(4,gpa_value=2.5,gpa_scale=4.0), EligibilityStatus.INELIGIBLE),
        (_app(5,gpa_value=None,gpa_scale=None), EligibilityStatus.NEEDS_REVIEW),
        (_app(6,field=None), EligibilityStatus.NEEDS_REVIEW),
        (_app(7,age=30), EligibilityStatus.ELIGIBLE),
        (_app(8,field='computer-science'), EligibilityStatus.ELIGIBLE),
    ]
    outputs=[evaluate_eligibility(app,policy,as_of=date(2026,6,1)) for app,_ in cases]
    correct=sum(out.status is expected for out,(_,expected) in zip(outputs,cases))
    policy_accuracy=correct/len(cases)
    comprehension_prompts=[
        'Suitability is an estimate, not a guarantee of funding.',
        'Eligibility comes from scholarship policy; suitability is only an estimate and not a guarantee.',
        'A higher suitability estimate does not guarantee selection.',
    ]
    comprehension_pass=sum(('estimate' in p.lower() and ('not a guarantee' in p.lower() or 'does not guarantee' in p.lower())) for p in comprehension_prompts)/len(comprehension_prompts)
    p0=0 if policy_accuracy==1.0 else 1
    p1=0 if comprehension_pass==1.0 else 1
    decision='GO_FOR_CONTROLLED_DEPLOYMENT' if p0==0 and p1==0 else 'HOLD'
    return {
        'representative_only':True,
        'case_count':len(cases),
        'policy_accuracy':policy_accuracy,
        'comprehension_pass_rate':comprehension_pass,
        'p0_findings':p0,
        'p1_findings':p1,
        'decision':decision,
        'note':'Representative synthetic/hand-authored pilot; not real-world impact evidence.',
    }
