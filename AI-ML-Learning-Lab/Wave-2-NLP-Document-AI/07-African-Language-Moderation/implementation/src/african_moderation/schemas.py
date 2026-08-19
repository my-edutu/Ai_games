from typing import Literal
from pydantic import BaseModel, Field, field_validator
from .policy import SUPPORTED_LANGUAGES
class ModerationRequest(BaseModel):
    text:str=Field(min_length=1,max_length=5000)
    language:str
    @field_validator('language')
    @classmethod
    def lang_supported(cls,v):
        if v not in SUPPORTED_LANGUAGES: raise ValueError(f'unsupported language: {v}')
        return v
class ModerationResponse(BaseModel):
    label:Literal['safe','harassment','threat']|None
    probability:float|None
    abstained:bool
    human_review_required:bool
    code_switched:bool
    language:str
    model_version:str
    artifact_sha256:str
    policy_version:str
    data_version:str
