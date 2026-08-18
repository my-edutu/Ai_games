from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field, field_validator

EducationLevel = Literal["none", "primary", "secondary", "diploma", "bachelors", "masters", "doctorate"]
OpportunityType = Literal["scholarship", "internship", "fellowship", "grant", "job", "training"]


class UserProfile(BaseModel):
    user_id: str = Field(min_length=1)
    age: int = Field(ge=0, le=120)
    citizenships: list[str] = Field(min_length=1)
    residence_country: str = Field(min_length=2, max_length=3)
    education_level: EducationLevel
    years_experience: float = Field(ge=0, le=80)
    skills: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    preferred_types: list[OpportunityType] = Field(default_factory=list)
    preferred_locations: list[str] = Field(default_factory=list)
    max_fee_usd: float | None = Field(default=None, ge=0)
    gender: str | None = None
    disability_status: str | None = None

    @field_validator("citizenships", "skills", "interests", "preferred_locations")
    @classmethod
    def normalize_list(cls, values: list[str]) -> list[str]:
        return sorted({v.strip().lower() if len(v) > 3 else v.strip().upper() for v in values if v.strip()})

    def ranking_feature_dict(self) -> dict[str, object]:
        return self.model_dump(exclude={"gender", "disability_status"})


class Opportunity(BaseModel):
    opportunity_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    opportunity_type: OpportunityType
    min_age: int | None = Field(default=None, ge=0, le=120)
    max_age: int | None = Field(default=None, ge=0, le=120)
    eligible_citizenships: list[str] = Field(default_factory=list)
    eligible_residence_countries: list[str] = Field(default_factory=list)
    min_education: EducationLevel = "none"
    min_years_experience: float = Field(default=0, ge=0, le=80)
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    location: str = "remote"
    fee_usd: float = Field(default=0, ge=0)
    active: bool = True

    @field_validator("eligible_citizenships", "eligible_residence_countries", "required_skills", "preferred_skills", "tags")
    @classmethod
    def normalize_list(cls, values: list[str]) -> list[str]:
        return sorted({v.strip().lower() if len(v) > 3 else v.strip().upper() for v in values if v.strip()})
