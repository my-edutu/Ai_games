import hashlib
def fingerprint(vendor,date,total,currency): return hashlib.sha256(f"{str(vendor).strip().lower()}|{date}|{total}|{currency}".encode()).hexdigest()
class DuplicateIndex:
    def __init__(self): self._seen={}
    def check(self,record):
        key=fingerprint(record.vendor.value,record.date.value,record.total.value,record.currency.value); prior=self._seen.get(key)
        if prior and prior!=record.document_id: record.duplicate_of=prior; record.needs_review=True
        else: self._seen[key]=record.document_id
        return record
