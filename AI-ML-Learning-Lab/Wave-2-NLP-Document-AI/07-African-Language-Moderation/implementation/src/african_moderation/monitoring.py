class VersionRegistry:
    def __init__(self): self.active={}; self.history={}
    def activate(self,kind,version):
        if kind in self.active: self.history.setdefault(kind,[]).append(self.active[kind])
        self.active[kind]=version
    def rollback(self,kind):
        if not self.history.get(kind): raise ValueError('no rollback version')
        self.active[kind]=self.history[kind].pop(); return self.active[kind]
class ReviewQueue:
    def __init__(self): self._items=[]
    def add(self,item): self._items.append(dict(item))
    @property
    def items(self): return tuple(dict(x) for x in self._items)
def detect_drift(reference_uncertainty,current_uncertainty,threshold=0.15):
    out=[]
    for lang,cur in current_uncertainty.items():
        ref=reference_uncertainty.get(lang,cur)
        if cur-ref>threshold: out.append(f'{lang}:uncertainty_shift')
    return out
