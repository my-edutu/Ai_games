def exact_field_accuracy(preds,truths,field): return sum(getattr(p,field).value==t[field] for p,t in zip(preds,truths))/len(preds) if preds else 0
def amount_mae(preds,truths,field):
    vals=[abs(float(getattr(p,field).value)-float(t[field])) for p,t in zip(preds,truths) if isinstance(getattr(p,field).value,(int,float))]; return sum(vals)/len(vals) if vals else float("inf")
def review_rate(preds): return sum(bool(p.needs_review) for p in preds)/len(preds) if preds else 0
