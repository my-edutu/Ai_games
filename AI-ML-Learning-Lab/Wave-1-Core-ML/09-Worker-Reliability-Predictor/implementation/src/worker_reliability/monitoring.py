from datetime import datetime, timezone

class VersionRegistry:
    def __init__(self): self.active={}; self.history={}
    def activate(self,kind,version):
        if kind in self.active: self.history.setdefault(kind,[]).append(self.active[kind])
        self.active[kind]=version
    def rollback(self,kind):
        hist=self.history.get(kind,[])
        if not hist: raise ValueError('no prior version')
        self.active[kind]=hist.pop()

class AuditLog:
    def __init__(self): self.records=[]
    def append(self,**record): self.records.append({'ts':datetime.now(timezone.utc).isoformat(),**record})

def diagnose_drift(input_psi,calibration_delta,policy_change_rate):
    if policy_change_rate >= .1: return 'policy_change'
    if input_psi >= .2: return 'data_drift'
    if calibration_delta >= .08: return 'model_calibration_drift'
    return 'stable'
