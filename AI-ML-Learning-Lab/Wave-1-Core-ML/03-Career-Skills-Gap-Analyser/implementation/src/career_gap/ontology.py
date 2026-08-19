from pydantic import BaseModel

class OntologySkill(BaseModel):
    id: str
    name: str
    aliases: list[str]
    category: str
    prerequisites: list[str] = []

class SkillOntology(BaseModel):
    version: str
    skills: list[OntologySkill]
    def resolve(self, text: str):
        t=' '.join(text.lower().strip().split())
        for skill in self.skills:
            values=[skill.id, skill.name, *skill.aliases]
            if any(t==' '.join(v.lower().strip().split()) for v in values):
                return skill
        return None
    def get(self, skill_id: str):
        return next((s for s in self.skills if s.id==skill_id), None)
