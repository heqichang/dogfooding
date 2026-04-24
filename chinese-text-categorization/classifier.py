from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import SVC
import joblib
import os
from config import Config


class BaseClassifier:
    def __init__(self):
        self.model = None
        self.classes_ = None
    
    def fit(self, X, y):
        self.model.fit(X, y)
        self.classes_ = self.model.classes_
    
    def predict(self, X):
        if self.model is None:
            raise ValueError("Model has not been trained yet. Call fit() first.")
        return self.model.predict(X)
    
    def predict_proba(self, X):
        if self.model is None:
            raise ValueError("Model has not been trained yet. Call fit() first.")
        return self.model.predict_proba(X)
    
    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.model, filepath)
    
    def load(self, filepath):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        self.model = joblib.load(filepath)
        self.classes_ = self.model.classes_


class NaiveBayesClassifier(BaseClassifier):
    def __init__(self, alpha=1.0):
        super().__init__()
        self.model = MultinomialNB(alpha=alpha)
    
    def get_params(self):
        return self.model.get_params()
    
    def set_params(self, **params):
        self.model.set_params(**params)


class SVMClassifier(BaseClassifier):
    def __init__(self, C=1.0, kernel='linear', probability=True, random_state=None):
        super().__init__()
        if random_state is None:
            random_state = Config.RANDOM_STATE
        self.model = SVC(
            C=C,
            kernel=kernel,
            probability=probability,
            random_state=random_state
        )
    
    def get_params(self):
        return self.model.get_params()
    
    def set_params(self, **params):
        self.model.set_params(**params)
