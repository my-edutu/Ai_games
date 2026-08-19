class CorrectionLedger:
    def __init__(self):
        self._corrections={}
        self.audit_log=[]
    def submit(self, worker_id, original, corrected, reason):
        self._corrections[(worker_id, original.event_id)] = corrected
        self.audit_log.append({'worker_id':worker_id,'event_id':original.event_id,'reason':reason,'from':original.outcome,'to':corrected.outcome})
    def apply(self, worker_id, history):
        return [self._corrections.get((worker_id,h.event_id),h) for h in history]
