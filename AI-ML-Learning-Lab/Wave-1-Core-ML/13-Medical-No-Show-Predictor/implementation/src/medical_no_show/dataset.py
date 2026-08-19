import hashlib, json
def snapshot_hash(rows):
    canonical=json.dumps(sorted(rows,key=lambda r: json.dumps(r,sort_keys=True)),sort_keys=True,separators=(",",":"))
    return hashlib.sha256(canonical.encode()).hexdigest()
