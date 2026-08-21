from dataclasses import dataclass, field

@dataclass
class VersionRegistry:
    active: dict[str,str] = field(default_factory=dict)
    history: dict[str,list[str]] = field(default_factory=dict)
    def activate(self, kind: str, version: str):
        current=self.active.get(kind)
        if current is not None and current != version:
            self.history.setdefault(kind,[]).append(current)
        self.active[kind]=version
    def rollback(self, kind: str):
        hist=self.history.get(kind,[])
        if not hist:
            raise ValueError(f"no rollback version for {kind}")
        self.active[kind]=hist.pop()
        return self.active[kind]

def drift_report(reference: dict, current: dict) -> list[str]:
    issues=[]
    if abs(float(current['mean_score'])-float(reference['mean_score'])) >= 10:
        issues.append('score_shift')
    if float(reference['citation_rate'])-float(current['citation_rate']) >= .2:
        issues.append('citation_grounding_shift')
    return issues
