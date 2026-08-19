from .schemas import UserProfile, RoleProfile, GapAnalysis, GapItem, EvidenceState
from .ontology import SkillOntology

def analyse_gaps(user: UserProfile, role: RoleProfile, ontology: SkillOntology) -> GapAnalysis:
    evidence={e.skill_id:e for e in user.evidence}
    items=[]
    for req in role.skills:
        ev=evidence.get(req.skill_id)
        if ev is None:
            items.append(GapItem(skill_id=req.skill_id,status='unknown',target_level=req.target_level,current_level=None,gap_size=None,importance=req.importance,evidence_state=EvidenceState.unknown,confidence=0,reason='No evidence supplied; unknown is not treated as absence.'))
            continue
        if ev.state==EvidenceState.inferred:
            items.append(GapItem(skill_id=req.skill_id,status='inferred_needs_confirmation',target_level=req.target_level,current_level=ev.proficiency,gap_size=None,importance=req.importance,evidence_state=ev.state,confidence=ev.confidence,reason='Skill inferred from related evidence; confirmation required.'))
            continue
        current=ev.proficiency or 0
        if current>=req.target_level:
            status='met'; gap=0; reason='Observed evidence meets target proficiency.'
        else:
            status='gap'; gap=req.target_level-current; reason='Observed evidence is below target proficiency.'
        items.append(GapItem(skill_id=req.skill_id,status=status,target_level=req.target_level,current_level=current,gap_size=gap,importance=req.importance,evidence_state=ev.state,confidence=ev.confidence,reason=reason))
    return GapAnalysis(user_id=user.id,role_id=role.id,ontology_version=ontology.version,role_version=role.version,items=items)
