from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .schemas import SemanticMatch

class SemanticMatcher:
    def __init__(self, ontology): self.ontology=ontology
    def fit(self):
        self.docs=[]; self.ids=[]
        for s in self.ontology.skills:
            self.docs.append(' '.join([s.name,*s.aliases,s.category])); self.ids.append(s.id)
        self.vectorizer=TfidfVectorizer(ngram_range=(1,2),analyzer='word',min_df=1)
        self.matrix=self.vectorizer.fit_transform(self.docs)
        return self
    def match(self, text:str, min_score=.35):
        q=self.vectorizer.transform([text]); sims=cosine_similarity(q,self.matrix)[0]
        i=int(sims.argmax()); score=float(sims[i])
        if score<min_score: return SemanticMatch(status='unknown',score=score)
        return SemanticMatch(status='matched',skill_id=self.ids[i],score=score)
