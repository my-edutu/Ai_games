from dataclasses import dataclass
import hashlib,json,numpy as np
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from .evaluation import evaluate
from .text import normalize_text
@dataclass
class ModelBundle:
    model:object; metrics:dict; train_groups:list[str]; validation_groups:list[str]; holdout_groups:list[str]; threshold:float; model_version:str; artifact_sha256:str
def _input(text,language): return f'__lang_{language}__ '+normalize_text(text).lower()
def _fingerprint(model,threshold):
    vec=model.named_steps['tfidf']; clf=model.named_steps['clf']; payload={'vocab':sorted(vec.vocabulary_.items()),'coef':np.round(clf.coef_,10).tolist(),'intercept':np.round(clf.intercept_,10).tolist(),'classes':clf.classes_.tolist(),'threshold':threshold}; return hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
def train_model(rows):
    tr=[r for r in rows if not r.holdout and not r.validation]; va=[r for r in rows if r.validation]; ho=[r for r in rows if r.holdout]
    pipe=Pipeline([('tfidf',TfidfVectorizer(analyzer='char_wb',ngram_range=(2,5),min_df=1)),('clf',LogisticRegression(max_iter=1500,C=4,random_state=7))]); pipe.fit([_input(r.text,r.language) for r in tr],[r.label for r in tr])
    pv=pipe.predict_proba([_input(r.text,r.language) for r in va]); yv=np.asarray([r.label for r in va]); predv=pipe.classes_[np.argmax(pv,axis=1)]; conf=np.max(pv,axis=1); correct=conf[predv==yv]; threshold=float(max(0.55,min(0.65,np.quantile(correct,0.10)-0.03))) if len(correct) else 0.60
    Xh=[_input(r.text,r.language) for r in ho]; y=[r.label for r in ho]; p=pipe.predict_proba(Xh); pred=pipe.classes_[np.argmax(p,axis=1)]; metrics=evaluate(y,pred,p,[r.language for r in ho],pipe.classes_); metrics['threshold_source']='validation_template_groups'; metrics['threshold']=threshold
    return ModelBundle(pipe,metrics,sorted({r.group_id for r in tr}),sorted({r.group_id for r in va}),sorted({r.group_id for r in ho}),threshold,'afmod-char-v1',_fingerprint(pipe,threshold))
def predict(bundle,text,language):
    p=bundle.model.predict_proba([_input(text,language)])[0]; i=int(np.argmax(p)); return {'label':str(bundle.model.classes_[i]),'probability':float(p[i]),'probabilities':{str(c):float(p[j]) for j,c in enumerate(bundle.model.classes_)}}
