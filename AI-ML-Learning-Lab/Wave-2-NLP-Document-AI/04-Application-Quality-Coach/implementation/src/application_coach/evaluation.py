def evaluate_holdout(bundle): return dict(bundle.metrics)
def rubric_error_report(review_results):
    out={}
    for r in review_results:
        for d in r.dimensions: out.setdefault(d.name,[]).append(d.score)
    return {k:{"mean_score":sum(v)/len(v),"n":len(v)} for k,v in out.items()}
