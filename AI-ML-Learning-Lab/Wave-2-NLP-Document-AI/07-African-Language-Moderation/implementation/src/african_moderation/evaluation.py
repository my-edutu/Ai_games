import numpy as np
from sklearn.metrics import f1_score
LABELS=['safe','harassment','threat']
def multiclass_brier(y,proba,classes):
    idx={c:i for i,c in enumerate(classes)}; one=np.zeros_like(proba)
    for r,label in enumerate(y): one[r,idx[label]]=1
    return float(np.mean(np.sum((proba-one)**2,axis=1)))
def evaluate(y,pred,proba,languages,classes):
    y=np.asarray(y); pred=np.asarray(pred); languages=np.asarray(languages)
    out={'evaluation_scope':'held_out_template_groups','macro_f1':float(f1_score(y,pred,labels=LABELS,average='macro',zero_division=0)),'multiclass_brier':multiclass_brier(y,proba,classes),'per_language':{},'per_language_label_recall':{}}
    for lang in sorted(set(languages)):
        m=languages==lang; out['per_language'][lang]={'macro_f1':float(f1_score(y[m],pred[m],labels=LABELS,average='macro',zero_division=0)),'count':int(m.sum())}
        for label in LABELS:
            lm=m & (y==label); out['per_language_label_recall'][f'{lang}:{label}']=float(np.mean(pred[lm]==label)) if lm.any() else None
    return out
