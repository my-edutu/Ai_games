from .schemas import SkillEvidence, EvidenceState
from .ontology import SkillOntology

class EvidenceExtractor:
    def __init__(self, ontology: SkillOntology): self.ontology=ontology
    def extract(self, text: str, source_id: str):
        low=' '.join(text.lower().split())
        found={}
        for skill in self.ontology.skills:
            terms=[skill.name,*skill.aliases]
            if any(term.lower() in low for term in terms):
                found[skill.id]=SkillEvidence(skill_id=skill.id,state=EvidenceState.observed,proficiency=2,confidence=.9,source_id=source_id,source_excerpt=text[:240])
        for sid, evidence in list(found.items()):
            skill=self.ontology.get(sid)
            for pre in skill.prerequisites:
                if pre not in found:
                    found[pre]=SkillEvidence(skill_id=pre,state=EvidenceState.inferred,proficiency=None,confidence=.55,source_id=f'inferred-from:{sid}',source_excerpt=None)
        return list(found.values())
