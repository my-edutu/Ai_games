from enum import Enum
from pydantic import BaseModel, Field
from typing import Literal

class EvidenceState(str, Enum):
    observed='observed'; inferred='inferred'; unknown='unknown'

class SkillEvidence(BaseModel):
    skill_id: str
    state: EvidenceState
    proficiency: int | None = Field(default=None, ge=0, le=5)
    confidence: float = Field(ge=0, le=1)
    source_id: str
    source_excerpt: str | None = None

class RoleSkill(BaseModel):
    skill_id: str
    importance: Literal['required','preferred','optional']
    target_level: int = Field(ge=0, le=5)

class RoleProfile(BaseModel):
    id: str
    title: str
    version: str
    skills: list[RoleSkill]

class UserProfile(BaseModel):
    id: str
    evidence: list[SkillEvidence]

class GapItem(BaseModel):
    skill_id: str
    status: Literal['met','gap','unknown','inferred_needs_confirmation']
    target_level: int
    current_level: int | None
    gap_size: int | None
    importance: str
    evidence_state: EvidenceState
    confidence: float
    reason: str

class GapAnalysis(BaseModel):
    user_id: str
    role_id: str
    ontology_version: str
    role_version: str
    items: list[GapItem]
    def by_skill(self, skill_id: str) -> GapItem:
        return next(x for x in self.items if x.skill_id==skill_id)

class LearningRecommendation(BaseModel):
    skill_id: str
    priority: float
    reason: str

class SemanticMatch(BaseModel):
    status: Literal['matched','unknown']
    skill_id: str | None = None
    score: float = 0.0
