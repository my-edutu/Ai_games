class VersionRegistry:
    def __init__(self): self._history={}
    def activate(self,kind,version): self._history.setdefault(kind,[]).append(version)
    def active(self,kind): return self._history[kind][-1] if self._history.get(kind) else None
    def rollback(self,kind):
        if len(self._history.get(kind,[]))>1: self._history[kind].pop()
        return self.active(kind)
def detect_drift(reference,current):
    issues=[]
    if current.get("grounding_precision",1)<reference.get("grounding_precision",1)-.1: issues.append("grounding_precision_drop")
    if abs(current.get("mean_score",0)-reference.get("mean_score",0))>10: issues.append("score_distribution_shift")
    if current.get("rewrite_violation_rate",0)>reference.get("rewrite_violation_rate",0)+.02: issues.append("rewrite_faithfulness_drift")
    return issues
