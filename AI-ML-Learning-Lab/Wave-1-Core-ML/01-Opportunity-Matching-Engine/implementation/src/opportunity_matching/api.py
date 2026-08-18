from __future__ import annotations
from fastapi import FastAPI
from pydantic import BaseModel, Field
from .schemas import UserProfile, Opportunity
from .baseline import RankedOpportunity


class MatchRequest(BaseModel):
    user: UserProfile
    opportunities: list[Opportunity] = Field(min_length=1)
    top_k: int = Field(default=10, ge=1, le=100)


class MatchResponse(BaseModel):
    results: list[RankedOpportunity]
    model_version: str
    data_version: str


def create_app(ranker, data_version: str) -> FastAPI:
    app = FastAPI(title="Opportunity Matching Engine", version="1.0.0")

    @app.get("/healthz")
    def healthz():
        return {"status": "ok", "model_version": getattr(ranker, "model_version", "baseline")}

    @app.post("/v1/match", response_model=MatchResponse)
    def match(request: MatchRequest):
        results = ranker.rank(request.user, request.opportunities, top_k=request.top_k)
        return MatchResponse(results=results, model_version=getattr(ranker, "model_version", "baseline-v1"), data_version=data_version)

    return app
