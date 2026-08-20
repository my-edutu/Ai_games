class VersionRegistry:
    def __init__(self): self.active={}
    def activate(self,kind,version): old=self.active.get(kind); self.active[kind]=version; return old
    def rollback(self,kind,version): self.active[kind]=version
def drift_alert(current_review_rate,baseline_review_rate,tolerance=.15): return abs(current_review_rate-baseline_review_rate)>tolerance
def field_confidence_drift(current_mean,baseline_mean,tolerance=.12): return baseline_mean-current_mean>tolerance
