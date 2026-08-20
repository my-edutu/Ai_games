from expense_intel.category_synthetic import category_dataset
from expense_intel.category_model import train_category_model,predict_category
def test_category_model_generalizes_to_unseen_phrases():
    X,y=category_dataset(); b=train_category_model(X,y); cases=[("airport hotel travel","travel"),("printer stationery paper","office"),("restaurant food lunch","meals"),("cloud software license","software")]; assert all(predict_category(b,t)[0]==lab for t,lab in cases)
def test_category_model_has_artifact_hash_and_confidence():
    X,y=category_dataset(); b=train_category_model(X,y); lab,conf=predict_category(b,"cloud software subscription"); assert b.artifact_sha256 and lab=="software" and .25<=conf<=1
