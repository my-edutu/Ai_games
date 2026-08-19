from african_moderation.synthetic import make_dataset
from african_moderation.model import train_model
if __name__=='__main__': print(train_model(make_dataset()).metrics)
