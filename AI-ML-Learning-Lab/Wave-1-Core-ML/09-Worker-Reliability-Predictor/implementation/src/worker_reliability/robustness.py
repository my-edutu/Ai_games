from .features import SERVING_FEATURES

def should_abstain(history_count:int,data_age_days:int,probability:float)->bool:
    uncertain=0.35 <= probability <= 0.65
    return uncertain and (history_count < 2 or data_age_days > 180)

def audit_feature_contract():
    prohibited={'protected_group','home_postcode','gender','race','ethnicity','religion','disability','nationality'}
    return sorted(prohibited.intersection(SERVING_FEATURES))
