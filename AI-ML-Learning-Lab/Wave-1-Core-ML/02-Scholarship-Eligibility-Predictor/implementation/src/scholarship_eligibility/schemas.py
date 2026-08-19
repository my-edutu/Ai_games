from __future__ import annotations
from datetime import date
from enum import Enum
from typing import Optional, Set
from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator

class EligibilityStatus(str, Enum):
    ELIGIBLE = 'eligible'
    INELIGIBLE = 'ineligible'
    NEEDS_REVIEW = 'needs_review'

class Applicant(BaseModel):
    applicant_id: str = Field(min_length=1)
    age: Optional[int] = Field(default=None, ge=0, le=120)
    citizenship: Optional[str] = None
    residency: Optional[str] = None
    degree_level: Optional[str] = None
    field: Optional[str] = None
    gpa_value: Optional[float] = Field(default=None, ge=0)
    gpa_scale: Optional[float] = Field(default=None, gt=0)
    financial_need_score: Optional[float] = Field(default=None, ge=0, le=1)
    leadership_score: Optional[float] = Field(default=None, ge=0, le=1)
    community_service_score: Optional[float] = Field(default=None, ge=0, le=1)
    essay_score: Optional[float] = Field(default=None, ge=0, le=1)
    experience_score: Optional[float] = Field(default=None, ge=0, le=1)
    protected_group: Optional[str] = None

    @field_validator('citizenship', 'residency')
    @classmethod
    def normalize_country(cls, v):
        return v.upper() if isinstance(v, str) else v

    @field_validator('degree_level', 'field')
    @classmethod
    def normalize_text(cls, v):
        return v.strip().lower().replace(' ', '-') if isinstance(v, str) else v

class ScholarshipPolicy(BaseModel):
    scholarship_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    version: str = Field(min_length=1)
    source_url: HttpUrl
    effective_date: date
    deadline: date
    min_gpa_4: Optional[float] = Field(default=None, ge=0, le=4)
    min_age: Optional[int] = Field(default=None, ge=0, le=120)
    max_age: Optional[int] = Field(default=None, ge=0, le=120)
    citizenship_allowlist: Set[str] = Field(default_factory=set)
    residency_allowlist: Set[str] = Field(default_factory=set)
    degree_levels: Set[str] = Field(default_factory=set)
    fields: Set[str] = Field(default_factory=set)

    @field_validator('citizenship_allowlist', 'residency_allowlist')
    @classmethod
    def normalize_countries(cls, v):
        return {x.upper() for x in v}

    @field_validator('degree_levels', 'fields')
    @classmethod
    def normalize_sets(cls, v):
        return {x.strip().lower().replace(' ', '-') for x in v}

    @model_validator(mode='after')
    def validate_ranges(self):
        if self.max_age is not None and self.min_age is not None and self.max_age < self.min_age:
            raise ValueError('max_age must be >= min_age')
        if self.deadline < self.effective_date:
            raise ValueError('deadline must not precede effective_date')
        return self

class EligibilityDecision(BaseModel):
    status: EligibilityStatus
    unmet_criteria: list[str] = Field(default_factory=list)
    unknown_criteria: list[str] = Field(default_factory=list)
    satisfied_criteria: list[str] = Field(default_factory=list)
    policy_version: str
    policy_source: str
    scholarship_id: str
