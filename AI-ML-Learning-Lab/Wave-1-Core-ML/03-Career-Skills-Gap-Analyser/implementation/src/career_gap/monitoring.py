import json
from pathlib import Path

class VersionRegistry:
    def __init__(self): self.ontologies=[]; self.models=[]; self.active_ontology=None; self.active_model=None
    def register_ontology(self,v):
        if v not in self.ontologies:self.ontologies.append(v)
    def register_model(self,v):
        if v not in self.models:self.models.append(v)
    def activate_ontology(self,v):
        if v not in self.ontologies: raise ValueError(v)
        self.active_ontology=v
    def activate_model(self,v):
        if v not in self.models: raise ValueError(v)
        self.active_model=v
    def rollback_ontology(self):
        i=self.ontologies.index(self.active_ontology); self.active_ontology=self.ontologies[max(0,i-1)]
    def rollback_model(self):
        i=self.models.index(self.active_model); self.active_model=self.models[max(0,i-1)]

def detect_drift(alias_miss_rate, unknown_skill_rate, confidence_mean):
    if alias_miss_rate>.2:return 'ontology_drift'
    if unknown_skill_rate>.3:return 'profile_drift'
    if confidence_mean<.5:return 'model_confidence_drift'
    return 'stable'

class AuditLog:
    def __init__(self,path): self.path=Path(path)
    def append(self,row):
        self.path.parent.mkdir(parents=True,exist_ok=True)
        with self.path.open('a',encoding='utf-8') as f:f.write(json.dumps(row,sort_keys=True)+'\n')
    def read(self):
        if not self.path.exists():return []
        return [json.loads(x) for x in self.path.read_text().splitlines() if x.strip()]
