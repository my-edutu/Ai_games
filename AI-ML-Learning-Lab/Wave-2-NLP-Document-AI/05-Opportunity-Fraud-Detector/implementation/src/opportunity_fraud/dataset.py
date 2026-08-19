import hashlib, json
from collections import Counter
from .features import normalize_text, normalize_domain

def snapshot_dataset(rows):
    payload=[{'id':r.record.opportunity_id,'campaign':r.record.campaign_id,'created_at':r.record.created_at.isoformat(),
              'domain':normalize_domain(r.record.url),'text':normalize_text(r.record.title+' '+r.record.description),'label':r.label,'severe':r.severe}
             for r in sorted(rows,key=lambda x:x.record.opportunity_id)]
    raw=json.dumps(payload,sort_keys=True,separators=(',',':')).encode()
    return {'rows':len(payload),'sha256':hashlib.sha256(raw).hexdigest()}

def quality_report(rows):
    labels=[r.label for r in rows]
    texts=[normalize_text(r.record.title+' '+r.record.description) for r in rows]
    dup=sum(1 for n in Counter(texts).values() if n>1)
    return {'rows':len(rows),'campaigns':len({r.record.campaign_id for r in rows}),
            'positive_rate':sum(labels)/max(1,len(labels)),'severe_rate':sum(r.severe for r in rows)/max(1,len(rows)),
            'duplicate_text_groups':dup}
