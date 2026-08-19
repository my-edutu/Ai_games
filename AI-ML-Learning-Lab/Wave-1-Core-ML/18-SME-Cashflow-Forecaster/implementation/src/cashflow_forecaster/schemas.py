from datetime import date
from pydantic import BaseModel, Field, model_validator
class DailyCashflow(BaseModel):
    date: date
    cash_in: float=Field(ge=0)
    cash_out: float=Field(ge=0)
class Scenario(BaseModel):
    cash_in_multiplier: float=Field(default=1.0,gt=0,le=3)
    cash_out_multiplier: float=Field(default=1.0,gt=0,le=3)
class ForecastRequest(BaseModel):
    history: list[DailyCashflow]
    horizon_days: int=Field(ge=1,le=90)
    scenario: Scenario|None=None
    @model_validator(mode="after")
    def enough_history(self):
        if len(self.history)<28: raise ValueError("at least 28 daily observations required")
        return self
class ForecastPoint(BaseModel):
    date: date
    cash_in: float
    cash_in_low: float
    cash_in_high: float
    cash_out: float
    cash_out_low: float
    cash_out_high: float
    net_cash: float
    net_low: float
    net_high: float
