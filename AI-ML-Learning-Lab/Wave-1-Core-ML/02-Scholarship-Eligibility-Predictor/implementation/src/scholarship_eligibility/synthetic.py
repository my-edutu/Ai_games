from __future__ import annotations
import numpy as np
import pandas as pd

FEATURES = ['gpa_4','financial_need_score','leadership_score','community_service_score','essay_score','experience_score']

def generate_representative_applications(n: int = 1000, seed: int = 0) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    dates = pd.Timestamp('2026-01-01') + pd.to_timedelta(rng.integers(0, 365, size=n), unit='D')
    gpa = np.clip(rng.normal(3.15, 0.48, n), 1.2, 4.0)
    need = rng.beta(2.3, 2.0, n)
    leadership = rng.beta(2.0, 2.5, n)
    service = rng.beta(2.0, 2.2, n)
    essay = rng.beta(2.4, 1.9, n)
    experience = rng.beta(2.0, 2.0, n)
    latent = (
        1.2*(gpa-3.0) + 0.7*essay + 0.45*need + 0.25*service
        + 1.2*((leadership > 0.62) & (essay > 0.62))
        + 0.9*((need > 0.72) & (service > 0.58))
        + 0.7*((gpa > 3.55) & (experience > 0.55))
        - 1.4*((gpa < 2.6) & (essay < 0.45))
        - 2.2
    )
    p = 1/(1+np.exp(-latent))
    y = rng.binomial(1, p)
    regions = rng.choice(['north','south','west','east'], size=n, p=[.2,.35,.25,.2])
    return pd.DataFrame({
        'application_id':[f'app-{i:05d}' for i in range(n)],
        'application_date':dates,
        'gpa_4':gpa,
        'financial_need_score':need,
        'leadership_score':leadership,
        'community_service_score':service,
        'essay_score':essay,
        'experience_score':experience,
        'region':regions,
        'label':y,
    }).sort_values(['application_date','application_id']).reset_index(drop=True)
