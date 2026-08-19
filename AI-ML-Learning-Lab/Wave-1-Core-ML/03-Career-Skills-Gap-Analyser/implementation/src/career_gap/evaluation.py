from dataclasses import dataclass
from .semantic import SemanticMatcher

@dataclass
class BenchmarkResult:
    exact_accuracy: float
    semantic_accuracy: float
    unknown_false_positive_rate: float

def benchmark_matchers(ontology):
    cases=[('Python','python'),('py','python'),('Postgres database','sql'),('SQL','sql'),('predictive modeling','ml'),('machine learning pipelines','ml'),('python automation','python'),('SQL analytics','sql'),('marine archaeology',None),('violin performance',None)]
    semantic=SemanticMatcher(ontology).fit(); exact_ok=sem_ok=unknown_fp=unknown_n=0
    for text,expected in cases:
        exact=ontology.resolve(text); exact_id=exact.id if exact else None
        if exact_id==expected: exact_ok+=1
        m=semantic.match(text,min_score=.35); sem_id=m.skill_id if m.status=='matched' else None
        if sem_id==expected: sem_ok+=1
        if expected is None:
            unknown_n+=1
            if sem_id is not None: unknown_fp+=1
    return BenchmarkResult(exact_ok/len(cases),sem_ok/len(cases),unknown_fp/max(1,unknown_n))

def cohort_unknown_rates(analyses:dict[str,list[str]]):
    return {name:(sum(1 for x in statuses if x=='unknown')/len(statuses) if statuses else 0.0) for name,statuses in analyses.items()}
