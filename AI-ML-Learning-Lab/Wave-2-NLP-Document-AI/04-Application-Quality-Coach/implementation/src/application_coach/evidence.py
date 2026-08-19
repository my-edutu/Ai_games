import re
from .schemas import EvidenceSpan
_SENTENCE=re.compile(r'[^.!?]+(?:[.!?]|$)')
_MARKERS=re.compile(r'\b(?:led|built|created|managed|organized|increased|reduced|improved|launched|delivered|achieved|volunteers?|team|learned|measured)\b|\b\d+(?:\.\d+)?%?\b',re.I)
def extract_evidence_spans(text:str):
    out=[]
    for m in _SENTENCE.finditer(text):
        s=m.group(0).strip()
        if s and _MARKERS.search(s):
            start=text.find(s,m.start())
            out.append(EvidenceSpan(text=s,start=start,end=start+len(s)))
    return out
def criterion_spans(text:str,criteria:list[str]):
    out=[]; low=text.lower()
    for c in criteria:
        c2=c.lower().strip()
        if not c2: continue
        idx=low.find(c2)
        if idx>=0: out.append(EvidenceSpan(text=text[idx:idx+len(c2)],start=idx,end=idx+len(c2)))
    return out
