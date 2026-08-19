class VersionRegistry:
    def __init__(self,model,data,policy): self._h={"model":[model],"data":[data],"policy":[policy]}
    @property
    def active_model(self): return self._h["model"][-1]
    @property
    def active_data(self): return self._h["data"][-1]
    @property
    def active_policy(self): return self._h["policy"][-1]
    def activate(self,kind,version): self._h[kind].append(version)
    def rollback(self,kind):
        if len(self._h[kind])>1: self._h[kind].pop()
class AuditLog:
    def __init__(self): self._rows=[]
    def append(self,row): self._rows.append(dict(row))
    def entries(self): return tuple(dict(x) for x in self._rows)
def drift_report(reference_mae,current_mae,reference_coverage,current_coverage):
    return {"mae_drift":current_mae>reference_mae*1.25,"coverage_drift":abs(current_coverage-reference_coverage)>.15}
