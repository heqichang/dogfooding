from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import os
from config import Config


def identity_function(x):
    return x


class TFIDFVectorizer:
    def __init__(self, max_features=None, ngram_range=None):
        if max_features is None:
            max_features = Config.TFIDF_MAX_FEATURES
        if ngram_range is None:
            ngram_range = Config.TFIDF_NGRAM_RANGE
        
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=ngram_range,
            tokenizer=identity_function,
            preprocessor=identity_function
        )
        self.is_fitted = False
    
    def fit(self, tokenized_texts):
        self.vectorizer.fit(tokenized_texts)
        self.is_fitted = True
    
    def transform(self, tokenized_texts):
        if not self.is_fitted:
            raise ValueError("Vectorizer has not been fitted yet. Call fit() first.")
        return self.vectorizer.transform(tokenized_texts)
    
    def fit_transform(self, tokenized_texts):
        X = self.vectorizer.fit_transform(tokenized_texts)
        self.is_fitted = True
        return X
    
    def get_feature_names(self):
        if not self.is_fitted:
            raise ValueError("Vectorizer has not been fitted yet. Call fit() first.")
        return self.vectorizer.get_feature_names_out()
    
    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.vectorizer, filepath)
    
    def load(self, filepath):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Vectorizer file not found: {filepath}")
        self.vectorizer = joblib.load(filepath)
        self.is_fitted = True
