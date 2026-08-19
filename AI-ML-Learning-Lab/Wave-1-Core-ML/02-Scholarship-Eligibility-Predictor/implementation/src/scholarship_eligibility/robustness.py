from __future__ import annotations
from pydantic import BaseModel, Field
import pandas as pd
from .schemas import Applicant
from .policy import normalize_gpa
from .synthetic import FEATURES
from .model import evaluate_classifier

DISCLAIMER = 'Suitability is an estimate of application strength based on representative data; it is not a guarantee of scholarship acceptance or funding.'

class SuitabilityResult(BaseModel):
    probability: float | None = Field(default=None, ge=0, le=1)
    band: str | None = None
    abstained: bool
    reason_codes: list[str]
    model_version: str
    disclaimer: str = DISCLAIMER

def predictive_feature_names() -> list[str]:
    return list(FEATURES)

def _feature_row(applicant: Applicant) -> pd.DataFrame | None:
    required = [
        applicant.gpa_value, applicant.gpa_scale, applicant.financial_need_score,
        applicant.leadership_score, applicant.community_service_score,
        applicant.essay_score, applicant.experience_score,
    ]
    if any(v is None for v in required):
        return None
    try:
        gpa4 = normalize_gpa(float(applicant.gpa_value), float(applicant.gpa_scale))
    except ValueError:
        return None
    return pd.DataFrame([{
        'gpa_4': gpa4,
        'financial_need_score': applicant.financial_need_score,
        'leadership_score': applicant.leadership_score,
        'community_service_score': applicant.community_service_score,
        'essay_score': applicant.essay_score,
        'experience_score': applicant.experience_score,
    }])

def score_suitability(model, applicant: Applicant) -> SuitabilityResult:
    row = _feature_row(applicant)
    version = getattr(model, 'version', 'unknown')
    if row is None:
        return SuitabilityResult(abstained=True, reason_codes=['PREDICTIVE_INPUT_MISSING'], model_version=version)
    probability = float(model.predict_proba(row[FEATURES])[:, 1][0])
    if probability < .35:
        band = 'lower'
    elif probability < .65:
        band = 'moderate'
    else:
        band = 'higher'
    return SuitabilityResult(probability=probability, band=band, abstained=False, reason_codes=['ESTIMATE_AVAILABLE'], model_version=version)

def fairness_report(model, df: pd.DataFrame, group_column: str) -> dict:
    if group_column not in df.columns:
        raise ValueError(f'unknown group column: {group_column}')
    groups = {}
    recalls = []
    for group, subset in df.groupby(group_column, dropna=False):
        metrics = evaluate_classifier(model, subset)
        groups[str(group)] = metrics
        recalls.append(metrics['recall'])
    gap = (max(recalls) - min(recalls)) if recalls else 0.0
    return {'group_column': group_column, 'groups': groups, 'max_recall_gap': float(gap)}
