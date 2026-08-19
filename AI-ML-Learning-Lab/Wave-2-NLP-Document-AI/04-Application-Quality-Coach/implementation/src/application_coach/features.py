import re, numpy as np
from .review import review_application
from .schemas import ReviewRequest
FEATURE_NAMES=["baseline_score","word_count","number_count","evidence_span_count","criteria_hit_rate"]
def text_features(text,criteria):
    base=review_application(ReviewRequest(application_text=text,opportunity_criteria=criteria)); wc=len(re.findall(r'\w+',text)); nums=len(re.findall(r'\b\d+(?:\.\d+)?%?\b',text)); spans=sum(len(d.evidence_spans) for d in base.dimensions); crit=[c for c in criteria if c.strip()]
    hit=sum(any(w.lower() in text.lower() for w in re.findall(r'\w+',c) if len(w)>2) for c in crit)
    return np.array([base.overall_score,wc,nums,spans,hit/max(1,len(crit))],dtype=float)
