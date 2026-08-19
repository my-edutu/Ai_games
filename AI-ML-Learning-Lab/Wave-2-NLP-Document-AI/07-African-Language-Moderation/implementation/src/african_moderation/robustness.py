from .model import predict
def perturbation_consistency(bundle,canonical,perturbed,language): return predict(bundle,canonical,language), predict(bundle,perturbed,language)
def should_abstain(probability,threshold): return probability < threshold
