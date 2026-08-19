from __future__ import annotations
from datetime import date
from .schemas import Applicant, ScholarshipPolicy, EligibilityDecision, EligibilityStatus

SUPPORTED_GPA_SCALES = {4.0, 5.0, 100.0}

def normalize_gpa(value: float, scale: float) -> float:
    if scale not in SUPPORTED_GPA_SCALES:
        raise ValueError('unsupported GPA scale')
    return round((value / scale) * 4.0, 6)

def evaluate_eligibility(applicant: Applicant, policy: ScholarshipPolicy, *, as_of: date | None = None) -> EligibilityDecision:
    as_of = as_of or date.today()
    unmet: list[str] = []
    unknown: list[str] = []
    satisfied: list[str] = []

    if as_of > policy.deadline:
        unmet.append('DEADLINE_PASSED')
    else:
        satisfied.append('DEADLINE_OPEN')

    def check_required(name: str, value, predicate, fail_code: str):
        if value is None:
            unknown.append(f'{name}_UNKNOWN')
        elif predicate(value):
            satisfied.append(f'{name}_SATISFIED')
        else:
            unmet.append(fail_code)

    if policy.min_age is not None:
        check_required('AGE', applicant.age, lambda x: x >= policy.min_age, 'AGE_BELOW_MIN')
    if policy.max_age is not None:
        if applicant.age is None:
            if 'AGE_UNKNOWN' not in unknown: unknown.append('AGE_UNKNOWN')
        elif applicant.age <= policy.max_age:
            satisfied.append('AGE_MAX_SATISFIED')
        else:
            unmet.append('AGE_ABOVE_MAX')

    if policy.citizenship_allowlist:
        check_required('CITIZENSHIP', applicant.citizenship, lambda x: x in policy.citizenship_allowlist, 'CITIZENSHIP_NOT_ALLOWED')
    if policy.residency_allowlist:
        check_required('RESIDENCY', applicant.residency, lambda x: x in policy.residency_allowlist, 'RESIDENCY_NOT_ALLOWED')
    if policy.degree_levels:
        check_required('DEGREE_LEVEL', applicant.degree_level, lambda x: x in policy.degree_levels, 'DEGREE_LEVEL_NOT_ALLOWED')
    if policy.fields:
        check_required('FIELD', applicant.field, lambda x: x in policy.fields, 'FIELD_NOT_ALLOWED')

    if policy.min_gpa_4 is not None:
        if applicant.gpa_value is None or applicant.gpa_scale is None:
            unknown.append('GPA_UNKNOWN')
        elif applicant.gpa_scale not in SUPPORTED_GPA_SCALES:
            unknown.append('GPA_SCALE_UNSUPPORTED')
        else:
            gpa4 = normalize_gpa(applicant.gpa_value, applicant.gpa_scale)
            if gpa4 >= policy.min_gpa_4:
                satisfied.append('GPA_SATISFIED')
            else:
                unmet.append('GPA_BELOW_MIN')

    status = EligibilityStatus.INELIGIBLE if unmet else (EligibilityStatus.NEEDS_REVIEW if unknown else EligibilityStatus.ELIGIBLE)
    return EligibilityDecision(
        status=status,
        unmet_criteria=unmet,
        unknown_criteria=unknown,
        satisfied_criteria=satisfied,
        policy_version=policy.version,
        policy_source=str(policy.source_url),
        scholarship_id=policy.scholarship_id,
    )
