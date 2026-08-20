import hashlib,json
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
@dataclass
class CategoryBundle: model:object; version:str; artifact_sha256:str
def train_category_model(texts,labels):
    pipe=Pipeline([("tfidf",TfidfVectorizer(ngram_range=(1,2),min_df=1)),("clf",LogisticRegression(max_iter=1000))]); pipe.fit(texts,labels); vocab=sorted(pipe.named_steps["tfidf"].vocabulary_.items()); sha=hashlib.sha256(json.dumps({"classes":sorted(set(labels)),"vocab":vocab},sort_keys=True).encode()).hexdigest(); return CategoryBundle(pipe,"expense-category-v1",sha)
def predict_category(bundle,text):
    probs=bundle.model.predict_proba([text])[0]; i=int(probs.argmax()); return str(bundle.model.classes_[i]),float(probs[i])
