from .schemas import GapAnalysis, LearningRecommendation
from .ontology import SkillOntology

WEIGHT={'required':3.0,'preferred':1.7,'optional':.7}

def prioritize_learning(analysis: GapAnalysis, ontology: SkillOntology):
    required_as_prereq={p for s in ontology.skills for p in s.prerequisites}
    out=[]
    for item in analysis.items:
        if item.status=='met': continue
        base=WEIGHT[item.importance]
        gap_factor=(item.gap_size or 1)
        uncertainty=.5 if item.status=='unknown' else .35 if item.status=='inferred_needs_confirmation' else 1.0
        prereq=1.8 if item.skill_id in required_as_prereq else 1.0
        priority=round(base*gap_factor*uncertainty*prereq,4)
        out.append(LearningRecommendation(skill_id=item.skill_id,priority=priority,reason=f'{item.importance}; status={item.status}; prerequisite_boost={prereq>1}'))
    return sorted(out,key=lambda x:(-x.priority,x.skill_id))
