import numpy as np
from sklearn.model_selection import train_test_split
def make_dataset(n=600,seed=13):
    rng=np.random.default_rng(seed)
    lead=rng.uniform(1,60,n)
    prior=rng.beta(1.5,6,n)
    hist=rng.integers(0,10,n)
    transport=rng.integers(0,2,n)
    reminder=rng.integers(0,2,n)
    clinic=rng.integers(0,3,n)
    logits=-2.5 + 0.025*lead + 2.2*prior + 0.5*transport - 0.35*reminder + 0.08*clinic
    p=1/(1+np.exp(-logits))
    y=rng.binomial(1,p)
    X=np.c_[lead,prior,hist,transport,reminder,clinic]
    groups=np.where(transport==1,"transport_barrier","no_transport_barrier")
    return X,y,groups
