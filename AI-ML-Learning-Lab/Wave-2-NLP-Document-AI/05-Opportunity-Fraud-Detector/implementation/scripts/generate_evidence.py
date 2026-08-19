from opportunity_fraud.synthetic import make_dataset
from opportunity_fraud.model import train_risk_model
if __name__=='__main__':
    b=train_risk_model(make_dataset(60,12,seed=8),seed=8)
    print(b.metrics)
