from pydantic import BaseModel, Field, model_validator

class Artifact(BaseModel):
    artifact_id: str = Field(min_length=1, max_length=128)
    kind: str = Field(min_length=1, max_length=64)
    content: str = Field(min_length=1, max_length=50000)

class Decision(BaseModel):
    decision_id: str = Field(min_length=1, max_length=128)
    action: str = Field(min_length=1, max_length=256)
    rationale: str = Field(min_length=1, max_length=5000)
    evidence_artifact_ids: list[str] = Field(default_factory=list)

class Submission(BaseModel):
    simulation_id: str = Field(min_length=1, max_length=128)
    candidate_id: str = Field(min_length=1, max_length=128)
    audit_group: str | None = Field(default=None, max_length=128)
    artifacts: list[Artifact] = Field(default_factory=list, max_length=100)
    decisions: list[Decision] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def validate_graph(self):
        ids=[a.artifact_id for a in self.artifacts]
        if len(ids) != len(set(ids)):
            raise ValueError("artifact_id values must be unique")
        known=set(ids)
        for d in self.decisions:
            missing=set(d.evidence_artifact_ids)-known
            if missing:
                raise ValueError(f"decision references missing artifact ids: {sorted(missing)}")
        return self
