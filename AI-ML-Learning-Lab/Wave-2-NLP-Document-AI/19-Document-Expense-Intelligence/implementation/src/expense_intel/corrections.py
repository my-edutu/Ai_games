from dataclasses import dataclass
from datetime import datetime,timezone
import hashlib,json
@dataclass(frozen=True)
class CorrectionEvent:
    document_id:str; field:str; old_value:object; new_value:object; reviewer_id:str; at:str; prev_hash:str; event_hash:str
class CorrectionLedger:
    def __init__(self): self.events=[]
    def append(self,document_id,field,old,new,reviewer_id):
        prev=self.events[-1].event_hash if self.events else "GENESIS"; at=datetime.now(timezone.utc).isoformat(); payload={"document_id":document_id,"field":field,"old_value":old,"new_value":new,"reviewer_id":reviewer_id,"at":at,"prev_hash":prev}; h=hashlib.sha256(json.dumps(payload,sort_keys=True,default=str).encode()).hexdigest(); e=CorrectionEvent(event_hash=h,**payload); self.events.append(e); return e
    def verify(self):
        prev="GENESIS"
        for e in self.events:
            payload={"document_id":e.document_id,"field":e.field,"old_value":e.old_value,"new_value":e.new_value,"reviewer_id":e.reviewer_id,"at":e.at,"prev_hash":prev}; h=hashlib.sha256(json.dumps(payload,sort_keys=True,default=str).encode()).hexdigest()
            if h!=e.event_hash:return False
            prev=h
        return True
