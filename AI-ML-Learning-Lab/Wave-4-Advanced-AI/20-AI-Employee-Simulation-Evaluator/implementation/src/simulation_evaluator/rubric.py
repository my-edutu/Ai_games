from dataclasses import dataclass

@dataclass(frozen=True)
class RubricDimension:
    name: str
    weight: float

@dataclass(frozen=True)
class Rubric:
    version: str
    dimensions: tuple[RubricDimension, ...]


def default_rubric(version: str = "rubric-v1") -> Rubric:
    return Rubric(
        version=version,
        dimensions=(
            RubricDimension("analysis", 0.25),
            RubricDimension("decision_quality", 0.25),
            RubricDimension("evidence_use", 0.20),
            RubricDimension("measurement", 0.15),
            RubricDimension("risk_awareness", 0.15),
        ),
    )
