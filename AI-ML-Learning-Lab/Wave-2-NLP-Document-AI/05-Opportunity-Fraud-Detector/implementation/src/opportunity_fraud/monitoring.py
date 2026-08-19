import numpy as np
class VersionRegistry:
    def __init__(self): self.active={}; self.history={}
    def activate(self,kind,version):
        if kind in self.active: self.history.setdefault(kind,[]).append(self.active[kind])
        self.active[kind]=version
    def rollback(self,kind):
        if not self.history.get(kind): raise ValueError('no rollback version')
        self.active[kind]=self.history[kind].pop(); return self.active[kind]
class AuditLog:
    def __init__(self): self._events=[]
    def append(self,event): self._events.append(dict(event))
    @property
    def events(self): return tuple(dict(e) for e in self._events)
def detect_drift(reference_scores,current_scores,reference_evidence_rate,current_evidence_rate):
    out=[]
    if abs(float(np.mean(current_scores))-float(np.mean(reference_scores)))>0.2: out.append('score_distribution_shift')
    if abs(float(current_evidence_rate)-float(reference_evidence_rate))>1.0: out.append('evidence_rate_shift')
    return out
