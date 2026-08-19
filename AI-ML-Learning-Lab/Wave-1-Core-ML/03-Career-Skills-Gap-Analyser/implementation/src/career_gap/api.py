from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .schemas import UserProfile, SkillEvidence
from .gap import analyse_gaps
from .recommend import prioritize_learning

class AnalyseRequest(BaseModel):
    user_id:str; role_id:str; evidence:list[SkillEvidence]

def create_app(ontology, roles):
    app=FastAPI(title='Career Skills Gap Analyser',version='1.0')
    @app.post('/v1/analyse')
    def analyse(req:AnalyseRequest):
        role=roles.get(req.role_id)
        if not role: raise HTTPException(404,'Unknown role')
        result=analyse_gaps(UserProfile(id=req.user_id,evidence=req.evidence),role,ontology)
        recs=prioritize_learning(result,ontology)
        return {'user_id':req.user_id,'role_id':role.id,'ontology_version':ontology.version,'role_version':role.version,'model_version':'semantic-tfidf-v1','gaps':[x.model_dump(mode='json') for x in result.items],'learning_priorities':[x.model_dump() for x in recs],'disclaimer':'Learning priorities are guidance, not a guarantee of employability.'}
    return app
