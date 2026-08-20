import hashlib,json
def split_by_vendor_template(docs,holdout_fraction=.25):
    groups=sorted(set(d.vendor_template for d in docs)); n=max(1,int(round(len(groups)*holdout_fraction))); hold=set(groups[-n:]); return [d for d in docs if d.vendor_template not in hold],[d for d in docs if d.vendor_template in hold]
def dataset_sha256(docs):
    rows=[{"document_id":d.document_id,"vendor_template":d.vendor_template,"raw_text":d.raw_text} for d in docs]; return hashlib.sha256(json.dumps(rows,sort_keys=True).encode()).hexdigest()
