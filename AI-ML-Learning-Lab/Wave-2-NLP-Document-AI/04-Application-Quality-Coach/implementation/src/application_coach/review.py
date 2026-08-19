import re
from .schemas import ReviewRequest, ReviewResult, DimensionResult
from .rubric import DEFAULT_RUBRIC
from .evidence import extract_evidence_spans, criterion_spans
_ACTION=re.compile(r'\b(?:led|built|created|managed|organized|increased|reduced|improved|launched|delivered|achieved|learned|measured)\b',re.I)
_NUMBER=re.compile(r'\b\d+(?:\.\d+)?%?\b')
_CONNECTOR=re.compile(r'\b(?:because|therefore|however|while|through|by|after|before|which|that)\b',re.I)
def _tokens(text): return re.findall(r"[A-Za-z0-9%'-]+",text.lower())
def _clamp(x): return max(0.0,min(100.0,float(x)))
def _dim(name,score,rationale,spans):
    return DimensionResult(name=name,score=round(_clamp(score),2),status="scored" if spans else "insufficient_evidence",rationale=rationale,evidence_spans=spans)
def review_application(req: ReviewRequest):
    text=req.application_text.strip(); toks=_tokens(text); wc=len(toks); evidence=extract_evidence_spans(text)
    sentences=[s for s in re.split(r'(?<=[.!?])\s+',text) if s.strip()]; avg=wc/max(1,len(sentences))
    clarity=90-abs(avg-18)*2
    if any(len(s.split())>35 for s in sentences): clarity-=15
    completeness=min(100,25+min(wc,180)/180*45+(20 if len(sentences)>=3 else 0)+(10 if _ACTION.search(text) else 0))
    ev_score=min(100,len(evidence)*22+(25 if _NUMBER.search(text) else 0)+(15 if _ACTION.search(text) else 0))
    criteria=[c.lower() for c in req.opportunity_criteria if c.strip()]; text_low=text.lower(); crit_hits=0
    for c in criteria:
        words=[w for w in re.findall(r'\w+',c) if len(w)>2]
        if words and any(w in text_low for w in words): crit_hits+=1
    relevance=50 if not criteria else 20+80*crit_hits/max(1,len(criteria))
    structure=min(100,35+len(sentences)*8+(15 if _CONNECTOR.search(text) else 0)); common=evidence[:3]
    dims=[_dim("clarity",clarity,"Sentence length and directness against the clarity anchor.",common[:1]),_dim("completeness",completeness,"Coverage of action, context, outcome and reflection.",common[:2]),_dim("evidence",ev_score,"Presence of specific actions and measurable or observable evidence.",common),_dim("relevance",relevance,"Overlap between application evidence and explicit opportunity criteria.",criterion_spans(text,req.opportunity_criteria) or common[:1]),_dim("structure",structure,"Organization across sentences and logical connectors.",common[:1])]
    weights={d.name:d.weight for d in DEFAULT_RUBRIC.dimensions}; overall=sum(d.score*weights[d.name] for d in dims)
    return ReviewResult(overall_score=round(overall,2),dimensions=dims)
