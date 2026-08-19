import hashlib, json
from .features import SERVING_FEATURES

def snapshot_rows(rows):
    normalized=[{k:float(r.get(k,0.0)) for k in SERVING_FEATURES} for r in rows]
    payload=json.dumps(normalized,sort_keys=True,separators=(',',':')).encode()
    return {'rows':normalized,'sha256':hashlib.sha256(payload).hexdigest(),'count':len(normalized)}
