class VersionRegistry:
    def __init__(self): self.active={"model":"m1","data":"d1","policy":"p1"}
    def activate(self,kind,version): self.active[kind]=version
    def rollback(self,kind,version): self.active[kind]=version

def diagnose_drift(data_shift=False,policy_change=False,calibration_shift=False):
    if data_shift:return "data_drift"
    if policy_change:return "policy_change"
    if calibration_shift:return "model_calibration_drift"
    return "stable"

class AuditLog:
    def __init__(self): self.entries=[]
    def append(self,event): self.entries.append(dict(event))
