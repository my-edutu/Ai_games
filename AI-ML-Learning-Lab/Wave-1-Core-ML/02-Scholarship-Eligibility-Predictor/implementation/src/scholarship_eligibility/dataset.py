from __future__ import annotations
from dataclasses import dataclass
from datetime import date
import hashlib, json
import pandas as pd

REQUIRED_COLUMNS = ['application_id','application_date','gpa_4','financial_need_score','leadership_score','community_service_score','essay_score','experience_score','region','label']

@dataclass(frozen=True)
class DatasetSnapshot:
    snapshot_hash: str
    row_count: int
    invalid_rows: int
    quality: dict[str, float]

def _canonical(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out['application_date'] = pd.to_datetime(out['application_date'])
    return out.sort_values(['application_date','application_id']).reset_index(drop=True)

def build_snapshot(df: pd.DataFrame) -> DatasetSnapshot:
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f'missing columns: {missing}')
    data = _canonical(df)
    numeric = ['gpa_4','financial_need_score','leadership_score','community_service_score','essay_score','experience_score','label']
    invalid_mask = data[numeric].isna().any(axis=1) | ~data['label'].isin([0,1])
    serial = data[REQUIRED_COLUMNS].to_json(orient='records', date_format='iso', double_precision=10)
    digest = hashlib.sha256(serial.encode()).hexdigest()
    quality = {
        'label_positive_rate': float(data['label'].mean()),
        'missing_fraction': float(data[REQUIRED_COLUMNS].isna().mean().mean()),
    }
    return DatasetSnapshot(digest, len(data), int(invalid_mask.sum()), quality)

def temporal_split(df: pd.DataFrame, cutoff: date):
    data = _canonical(df)
    cutoff_ts = pd.Timestamp(cutoff)
    return data[data.application_date < cutoff_ts].copy(), data[data.application_date >= cutoff_ts].copy()
