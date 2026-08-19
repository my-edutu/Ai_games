from .features import FEATURE_NAMES
PROTECTED_OR_CLINICAL={"age","sex","race","ethnicity","religion","diagnosis","disability","insurance_status","income"}
def audit_feature_contract():
    return sorted(set(FEATURE_NAMES)&PROTECTED_OR_CLINICAL)
def should_abstain(features, uncertainty: float):
    return features.get("history_count",0)==0 and features.get("days_since_last_contact",999)>365 or uncertainty>0.5
