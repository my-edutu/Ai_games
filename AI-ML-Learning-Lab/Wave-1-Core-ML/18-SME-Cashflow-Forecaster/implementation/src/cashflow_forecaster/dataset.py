import hashlib,json
from .schemas import DailyCashflow
def validate_series(rows):
    dates=[r.date for r in rows]
    if len(set(dates))!=len(dates): raise ValueError("duplicate dates")
    if dates!=sorted(dates): raise ValueError("series must be sorted ascending")
    return rows
def deterministic_hash(rows):
    validate_series(rows)
    payload=[{"date":r.date.isoformat(),"cash_in":r.cash_in,"cash_out":r.cash_out} for r in rows]
    return hashlib.sha256(json.dumps(payload,separators=(",",":"),sort_keys=True).encode()).hexdigest()
