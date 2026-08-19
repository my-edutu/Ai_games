from .model import predict_probability

def adversarial_consistency(bundle,canonical,obfuscated):
    return predict_probability(bundle,canonical), predict_probability(bundle,obfuscated)

def should_escalate(probability, threshold):
    return probability >= threshold or abs(probability-0.5) <= 0.12
