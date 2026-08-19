import re
from dataclasses import dataclass
from .schemas import RewriteRequest, RewriteResult
@dataclass
class FactInventory:
    tokens:set[str]
    phrases:set[str]
_NUM=re.compile(r'(?:\b\d+(?:,\d{3})*(?:\.\d+)?%?|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b)',re.I)
_PROPER=re.compile(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b')
_HIGH_RISK=re.compile(r'\b(?:scholarship|award|prize|fellowship|raised|revenue|employer|university|company)\b',re.I)
def extract_fact_inventory(text:str):
    toks=set(m.group(0).lower() for m in _NUM.finditer(text)); toks.update(m.group(0).lower() for m in _PROPER.finditer(text)); phrases=set(re.findall(r'\b(?:led|built|created|managed|organized|increased|reduced|improved|launched|delivered|achieved)\b[^.!?]*',text,re.I)); return FactInventory(toks,phrases)
def validate_rewrite_faithfulness(source:str,rewrite:str):
    src=extract_fact_inventory(source); out=extract_fact_inventory(rewrite); issues=[]
    for t in sorted(out.tokens-src.tokens): issues.append(f"new_fact:{t}")
    if _HIGH_RISK.search(rewrite):
        for m in _HIGH_RISK.finditer(rewrite):
            term=m.group(0).lower()
            if term not in source.lower(): issues.append(f"new_fact:{term}")
    return sorted(set(issues))
def rewrite_application(req: RewriteRequest):
    text=" ".join(req.application_text.split()); sentences=[s.strip() for s in re.split(r'(?<=[.!?])\s+',text) if s.strip()]; rewritten=" ".join(s[0].upper()+s[1:] if s else s for s in sentences); issues=validate_rewrite_faithfulness(req.application_text,rewritten)
    if issues: raise ValueError("rewrite failed faithfulness guard: "+",".join(issues))
    return RewriteResult(rewritten_text=rewritten,faithfulness_issues=[])
