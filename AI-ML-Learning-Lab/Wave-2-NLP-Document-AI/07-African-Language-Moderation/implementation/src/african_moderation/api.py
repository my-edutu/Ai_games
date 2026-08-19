from fastapi import FastAPI,HTTPException
from .schemas import ModerationRequest
from .model import predict
from .policy import PolicyPack
from .robustness import should_abstain
from .text import code_switch_signal
from .explain import review_snippets, context_dependent

def create_app(bundle=None,policy_pack=None,data_version='unconfigured'):
    policy_pack=policy_pack or PolicyPack(); app=FastAPI(title='African Language Moderation')
    @app.get('/health/ready')
    def ready():
        if bundle is None: raise HTTPException(503,'moderation model artifact not configured')
        return {'ready':True,'model_version':bundle.model_version,'artifact_sha256':bundle.artifact_sha256,'policy_version':policy_pack.version,'data_version':data_version,'supported_languages':sorted(policy_pack.supported_languages),'supported_labels':sorted(policy_pack.supported_labels),'native_speaker_validated':policy_pack.native_speaker_validated,'deployment_scope':'broad' if policy_pack.native_speaker_validated else 'controlled_only'}
    @app.post('/moderate')
    def moderate(req:ModerationRequest):
        if bundle is None: raise HTTPException(503,'moderation model artifact not configured')
        raw=predict(bundle,req.text,req.language); contextual=context_dependent(req.text); abstain=bool(contextual or should_abstain(raw['probability'],bundle.threshold)); label=None if abstain else raw['label']; review=bool(abstain or label!='safe')
        return {'label':label,'probability':None if abstain else raw['probability'],'abstained':abstain,'human_review_required':review,'code_switched':code_switch_signal(req.text,req.language),'context_dependent':contextual,'review_snippets':review_snippets(req.text,req.language),'language':req.language,'model_version':bundle.model_version,'artifact_sha256':bundle.artifact_sha256,'policy_version':policy_pack.version,'data_version':data_version,'deployment_scope':'broad' if policy_pack.native_speaker_validated else 'controlled_only','unsupported_categories':['hate'],'disclaimer':'Representative engineering model; context-sensitive moderation requires human review and native-speaker policy validation.'}
    return app
app=create_app()
