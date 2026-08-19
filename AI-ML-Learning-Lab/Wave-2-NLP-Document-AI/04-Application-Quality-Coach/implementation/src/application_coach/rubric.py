from pydantic import BaseModel
class RubricDimension(BaseModel):
    name: str
    weight: float
    anchors: tuple[int,int]=(0,100)
class Rubric(BaseModel):
    version: str
    dimensions: list[RubricDimension]
DEFAULT_RUBRIC=Rubric(version="rubric-v1",dimensions=[
    RubricDimension(name="clarity",weight=.20),
    RubricDimension(name="completeness",weight=.20),
    RubricDimension(name="evidence",weight=.25),
    RubricDimension(name="relevance",weight=.20),
    RubricDimension(name="structure",weight=.15),
])
def validate_rubric(rubric: Rubric):
    issues=[]
    if abs(sum(d.weight for d in rubric.dimensions)-1)>1e-9: issues.append("weights_must_sum_to_one")
    names=[d.name for d in rubric.dimensions]
    if len(names)!=len(set(names)): issues.append("duplicate_dimension")
    return issues
