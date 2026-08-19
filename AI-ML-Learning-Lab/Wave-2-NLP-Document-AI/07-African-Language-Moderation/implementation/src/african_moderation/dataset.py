import hashlib,json
from collections import Counter
def snapshot_dataset(rows):
    payload=[{'text':r.text,'language':r.language,'label':r.label,'group':r.group_id,'holdout':r.holdout,'validation':r.validation} for r in sorted(rows,key=lambda x:(x.language,x.label,x.group_id,x.text))]; raw=json.dumps(payload,sort_keys=True,separators=(',',':')).encode(); return {'rows':len(payload),'sha256':hashlib.sha256(raw).hexdigest()}
def quality_report(rows):
    langs=Counter(r.language for r in rows); labels=Counter(f'{r.language}:{r.label}' for r in rows); return {'rows':len(rows),'languages':dict(sorted(langs.items())),'language_label_counts':dict(sorted(labels.items())),'native_speaker_validated':False}
