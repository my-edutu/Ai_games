from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from urllib.parse import urlparse

class OpportunityRecord(BaseModel):
    opportunity_id: str = Field(min_length=1)
    campaign_id: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(min_length=1, max_length=30000)
    url: str
    publisher: str = Field(min_length=1, max_length=500)
    contact_email: str | None = None
    application_fee: float = Field(default=0.0, ge=0, le=1_000_000)
    publisher_age_days: int | None = Field(default=None, ge=0)
    prior_verified_posts: int | None = Field(default=None, ge=0)
    redirect_count: int = Field(default=0, ge=0, le=20)
    shortener_used: bool = False
    created_at: datetime

    @field_validator('url')
    @classmethod
    def valid_http_url(cls, v):
        p=urlparse(v)
        if p.scheme not in {'http','https'} or not p.hostname:
            raise ValueError('url must be http(s) with hostname')
        return v

class ReviewRequest(BaseModel):
    opportunity: OpportunityRecord

class RiskEvidence(BaseModel):
    code: str
    detail: str
    severity: str

class RiskResponse(BaseModel):
    opportunity_id: str
    risk_probability: float | None
    risk_band: str
    evidence: list[RiskEvidence]
    review_required: bool
    legal_conclusion: bool = False
    model_version: str
    artifact_sha256: str
    threat_policy_version: str
    data_version: str
