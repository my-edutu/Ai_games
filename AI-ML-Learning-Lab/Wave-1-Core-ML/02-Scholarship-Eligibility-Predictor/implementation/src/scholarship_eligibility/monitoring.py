from __future__ import annotations
from pathlib import Path
import json
import numpy as np

class PolicyRegistry:
    def __init__(self):
        self._items = {}
        self._active = {}
        self._history = {}
    def register(self, scholarship_id, version, payload):
        self._items[(scholarship_id, version)] = payload
        if scholarship_id not in self._active:
            self._active[scholarship_id] = version
    def activate(self, scholarship_id, version):
        key=(scholarship_id,version)
        if key not in self._items: raise KeyError(key)
        previous=self._active.get(scholarship_id)
        if previous is not None:
            self._history.setdefault(scholarship_id,[]).append(previous)
        self._active[scholarship_id]=version
    def active(self, scholarship_id):
        version=self._active[scholarship_id]
        return version,self._items[(scholarship_id,version)]
    def rollback(self, scholarship_id):
        history=self._history.get(scholarship_id,[])
        if not history: raise RuntimeError('no prior policy version')
        self._active[scholarship_id]=history.pop()

class ModelRegistry:
    def __init__(self):
        self._items={}; self._active=None; self._history=[]
    def register(self, version, payload):
        self._items[version]=payload
        if self._active is None:
            self._active=version
    def activate(self, version):
        if version not in self._items: raise KeyError(version)
        if self._active is not None: self._history.append(self._active)
        self._active=version
    def active(self): return self._active,self._items[self._active]
    def rollback(self):
        if not self._history: raise RuntimeError('no prior model version')
        self._active=self._history.pop()

class AuditLog:
    def __init__(self, path): self.path=Path(path)
    def append(self, record):
        self.path.parent.mkdir(parents=True,exist_ok=True)
        with self.path.open('a',encoding='utf-8') as f:
            f.write(json.dumps(record,sort_keys=True)+'\n')
    def read(self):
        if not self.path.exists(): return []
        return [json.loads(line) for line in self.path.read_text(encoding='utf-8').splitlines() if line.strip()]

def monitoring_status(*, unknown_field_rate: float, criteria_parse_failure_rate: float, baseline_probability_mean: float, current_probabilities) -> dict:
    probs=np.asarray(current_probabilities,dtype=float)
    current_mean=float(probs.mean()) if len(probs) else baseline_probability_mean
    distribution_shift=abs(current_mean-baseline_probability_mean)
    policy_alert = unknown_field_rate > .10 or criteria_parse_failure_rate > .05
    model_alert = distribution_shift > .15
    if policy_alert:
        domain='policy_data'
    elif model_alert:
        domain='model'
    else:
        domain='none'
    return {
        'primary_failure_domain':domain,
        'unknown_field_rate':float(unknown_field_rate),
        'criteria_parse_failure_rate':float(criteria_parse_failure_rate),
        'probability_mean_shift':float(distribution_shift),
        'policy_alert':policy_alert,
        'model_alert':model_alert,
    }
