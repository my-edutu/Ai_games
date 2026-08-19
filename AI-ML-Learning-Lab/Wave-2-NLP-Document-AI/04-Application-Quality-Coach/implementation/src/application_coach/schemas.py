from typing import List
from pydantic import BaseModel, Field, model_validator

class ReviewRequest(BaseModel):
    application_text: str = Field(min_length=30, max_length=20000)
    opportunity_criteria: List[str] = Field(default_factory=list, max_length=50)

class RewriteRequest(BaseModel):
    application_text: str = Field(min_length=20, max_length=20000)
    rewrite_intent: bool
    @model_validator(mode="after")
    def require_intent(self):
        if not self.rewrite_intent:
            raise ValueError("rewrite_intent must be explicitly true")
        return self

class EvidenceSpan(BaseModel):
    text: str
    start: int
    end: int

class DimensionResult(BaseModel):
    name: str
    score: float
    status: str
    rationale: str
    evidence_spans: list[EvidenceSpan] = Field(default_factory=list)

class ReviewResult(BaseModel):
    overall_score: float
    dimensions: list[DimensionResult]
    disclaimer: str = "Coaching feedback is advisory and must not invent applicant achievements."

class RewriteResult(BaseModel):
    rewritten_text: str
    faithfulness_issues: list[str] = Field(default_factory=list)
