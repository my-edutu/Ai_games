import numpy as np

def representative_dataset(n=700,seed=7):
    rng=np.random.default_rng(seed)
    tenure=rng.uniform(0,800,n); history=rng.integers(0,60,n); completion=np.clip(rng.beta(7,2,n),0,1); cancel=np.clip(rng.beta(1.4,8,n),0,1); noshow=np.clip(rng.beta(1.2,14,n),0,1); lateness=rng.gamma(2,4,n); distance=rng.gamma(2,4,n); duration=rng.uniform(2,12,n); lead=rng.uniform(2,240,n); night=rng.binomial(1,.25,n)
    X=np.c_[tenure,history,completion,cancel,noshow,lateness,distance,duration,lead,night]
    logit=-2.4 + 2.1*cancel + 3.0*noshow + .025*lateness + .025*distance + .45*night - .8*completion - .001*tenure
    p=1/(1+np.exp(-logit)); y=rng.binomial(1,p); cohort=np.where(distance>9,'long_distance','standard_distance')
    return X,y,cohort
